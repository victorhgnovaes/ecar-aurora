import 'dotenv/config'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { Prisma } from '@prisma/client'
import { prisma } from '../server/db.js'
import { calculatePrice } from '#conditions'

type Row = [family: string, year: number, description: string, code: string, percent: string]
const source = JSON.parse(readFileSync('data/conditions/chevrolet-aurora-2026-10.json', 'utf8')) as {
  referenceMonth: string; scope: string; sourceFileName: string; sourceSha256: string; sourceTitle: string;
  footer: string; stateRates: Record<string,string>; rows: Row[]
}
const codeOf = (model: string, optional: string) => model.replace(/[VT]$/, '') + optional
const familyOf = (name: string) => name.toLowerCase().replace(/\s+/g, '')
const rowKey = (row: Row) => `${familyOf(row[0])}:${row[1]}:${row[3]}`
const sourcePath = process.env.CONDITIONS_PDF || `data/sources/monthly/${source.sourceFileName}`

try {
  if (!existsSync(sourcePath) || createHash('sha256').update(readFileSync(sourcePath)).digest('hex') !== source.sourceSha256) throw new Error('PDF ausente ou hash divergente; importação cancelada')
  if (source.referenceMonth !== '2026-10' || source.scope !== 'Chevrolet / Aurora Alimentos' || source.rows.length !== 61) throw new Error('Escopo/contagem da revisão inválidos')
  if (new Set(source.rows.map(rowKey)).size !== source.rows.length) throw new Error('Código/ano duplicado no documento')
  for (const row of source.rows) {
    const percent = new Prisma.Decimal(row[4])
    if (percent.lt(0) || percent.gt(100) || !/^\d{4}$/.test(String(row[1]))) throw new Error(`Linha inválida: ${rowKey(row)}`)
  }
  mkdirSync('data/reports', { recursive: true })
  const report = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(1740240)`
    const versions = await tx.vehicleVersion.findMany({ where: { active: true, model: { active: true } }, include: { model: true, configurations: true, discount: true } })
    // This repository's catalog is Chevrolet-only; require the reviewed source rather than touching foreign catalogs.
    const reviewedCatalog = JSON.parse(readFileSync('data/generated/chevrolet-catalog.json', 'utf8'))
    const sourceDocument = await tx.sourceDocument.findUniqueOrThrow({ where: { sha256: reviewedCatalog.source.sha256 } })
    const scoped = versions.filter(v => v.sourceDocumentId === sourceDocument.id)
    const before = versions.map(v => ({ id: v.id, modelYear: v.model.modelYear, modelCode: v.modelCode, optionalCode: v.optionalCode, publicPriceNational: v.publicPriceNational.toFixed(2), publicPriceZfm: v.publicPriceZfm?.toFixed(2) ?? null }))
    const used = new Set<string>()
    const updated: unknown[] = [], unchanged: string[] = [], pendingVersions: unknown[] = []
    async function markPending(v: typeof scoped[number], reason:string) {
      if (!v.discount) return
      const oldAudit = v.discount.audit && typeof v.discount.audit==='object' && !Array.isArray(v.discount.audit) ? v.discount.audit : {legacyAudit:v.discount.audit}
      if (oldAudit.pendingReason !== reason || oldAudit.pendingReferenceMonth !== source.referenceMonth) await tx.versionDiscount.update({where:{id:v.discount.id},data:{audit:{...oldAudit,pendingReason:reason,pendingReferenceMonth:source.referenceMonth} as Prisma.InputJsonValue}})
    }
    for (const v of scoped) {
      const configurations = v.configurations.length ? v.configurations : [{ modelCode: v.modelCode, optionalCode: v.optionalCode }]
      const keys = configurations.map(c => `${familyOf(v.model.name)}:${v.model.modelYear}:${codeOf(c.modelCode, c.optionalCode)}`)
      const matches = keys.map(key => source.rows.find(row => rowKey(row) === key))
      const found = matches.filter((r): r is Row => !!r)
      if (!found.length) {
        const codes = configurations.map(c => codeOf(c.modelCode,c.optionalCode))
        const otherYears = source.rows.filter(row => familyOf(row[0]) === familyOf(v.model.name) && codes.includes(row[3]))
        if (otherYears.length) await markPending(v, 'Código encontrado somente em outro ano-modelo; condição anterior preservada')
        pendingVersions.push({ id: v.id, model: v.model.name, modelYear: v.model.modelYear, version: v.displayName, codes, reason: otherYears.length ? 'Código encontrado somente em outro ano-modelo; condição anterior preservada' : 'Código completo ausente do PDF; condição anterior preservada' })
        continue
      }
      const duplicate = keys.some(key => scoped.filter(candidate => candidate.model.modelYear === v.model.modelYear && familyOf(candidate.model.name) === familyOf(v.model.name) && candidate.configurations.some(c => `${familyOf(candidate.model.name)}:${candidate.model.modelYear}:${codeOf(c.modelCode,c.optionalCode)}` === key)).length > 1)
      const rate = new Prisma.Decimal(found[0][4]).div(100).toFixed(6)
      if (found.some(row => new Prisma.Decimal(row[4]).div(100).toFixed(6) !== rate) || duplicate) {
        await markPending(v, 'Versão agrupa configurações sem cobertura integral/unívoca pelo PDF; revisar antes de aplicar')
        pendingVersions.push({ id: v.id, model: v.model.name, modelYear: v.model.modelYear, version: v.displayName, keys, reason: 'Versão agrupa configurações sem cobertura integral/unívoca pelo PDF; revisar antes de aplicar' })
        continue
      }
      // Engine/transmission are cross-checked as well as the exact factory code and MY.
      const manual = /\(MT\)/.test(found[0][2]), automatic = /\(AT\)/.test(found[0][2])
      if ((manual && !/^(Transmissão|Câmbio) manual/i.test(v.transmission || '')) || (automatic && !/^(Transmissão|Câmbio) automátic/i.test(v.transmission || '')) || (v.model.name === 'S10' && !/2\.8L Diesel/.test(v.engine || ''))) {
        await markPending(v, 'Descrição/motorização/transmissão requer revisão')
        pendingVersions.push({id:v.id, keys, reason:'Descrição/motorização/transmissão requer revisão'}); continue
      }
      const previousAudit = (v.discount?.audit && !Array.isArray(v.discount.audit) ? v.discount.audit : {}) as Record<string,unknown>
      if (previousAudit.scope && previousAudit.scope !== source.scope) { pendingVersions.push({id:v.id, keys, reason:'Condição de outro público/empresa preservada'}); continue }
      found.forEach(row => used.add(rowKey(row)))
      const stateRates = v.model.name === 'Spark EUV' ? source.stateRates : {}
      const requiresConfiguration=found.length!==keys.length
      const configurationRates=requiresConfiguration?Object.fromEntries(configurations.map((c,i)=>[codeOf(c.modelCode,c.optionalCode),matches[i]?new Prisma.Decimal(matches[i]![4]).div(100).toFixed(6):null])):{}
      const audit = {
        scope: source.scope, referenceMonth: source.referenceMonth, page: 1, matchedRows: found.map(row => ({ family:row[0], modelYear:row[1], description:row[2], code:row[3], conditionPercent:row[4], commissionPercent:'2.5' })),
        stateRates, requiresBillingState: Object.keys(stateRates).length > 0,configurationRates,requiresConfiguration, footer: v.model.name === 'Spark EUV' ? source.footer : null,
        history: v.discount ? [...(Array.isArray(previousAudit.history) ? previousAudit.history : []), ...(v.discount.sourceSha256 !== source.sourceSha256 ? [{rate:v.discount.rate.toFixed(6), sourceFileName:v.discount.sourceFileName, sourceSha256:v.discount.sourceSha256, sourceTitle:v.discount.sourceTitle, sourceSheet:v.discount.sourceSheet, sourceCell:v.discount.sourceCell, sourceRow:v.discount.sourceRow, rawRate:v.discount.rawRate, calculationRule:v.discount.calculationRule, active:v.discount.active, audit:v.discount.audit, updatedAt:v.discount.updatedAt.toISOString()}] : [])] : [],
      }
      if (v.discount?.active && v.discount.sourceSha256 === source.sourceSha256 && v.discount.rate.eq(rate) && isDeepStrictEqual(previousAudit.matchedRows,audit.matchedRows) && isDeepStrictEqual(previousAudit.stateRates,stateRates) && isDeepStrictEqual(previousAudit.configurationRates??{},configurationRates) && !previousAudit.pendingReason) { unchanged.push(v.id); continue }
      const data = { rate:new Prisma.Decimal(rate), sourceFileName:source.sourceFileName, sourceSha256:source.sourceSha256, sourceSheet:'Página 1', sourceCell:found.map(row => `${row[3]} / MY${row[1] % 100} / Condição`).join('; '), sourceRow:source.rows.indexOf(found[0])+1, sourceTitle:source.sourceTitle, rawRate:found[0][4]+'%', calculationRule:'Preço público configurado × (1 − Condição/100); HALF_UP em centavos; Comissão não aplicada; UF substitui condição geral', audit:audit as Prisma.InputJsonValue, active:true }
      await tx.versionDiscount.upsert({ where:{vehicleVersionId:v.id}, create:{...data,vehicleVersionId:v.id}, update:data })
      updated.push({id:v.id,model:v.model.name,modelYear:v.model.modelYear,version:v.displayName,codes:found.map(row=>row[3]),rate,publicPriceNational:v.publicPriceNational.toFixed(2),...calculatePrice(v.publicPriceNational.toFixed(2),rate)})
    }
    const after = await tx.vehicleVersion.findMany({where:{id:{in:versions.map(v=>v.id)}}, include:{model:true}})
    for (const v of after) {
      const old=before.find(item=>item.id===v.id)!
      if (old.modelYear!==v.model.modelYear || old.modelCode!==v.modelCode || old.optionalCode!==v.optionalCode || old.publicPriceNational!==v.publicPriceNational.toFixed(2) || old.publicPriceZfm!==(v.publicPriceZfm?.toFixed(2) ?? null)) throw new Error('Identidade/preço público alterado; rollback')
    }
    return {referenceMonth:source.referenceMonth,sourceFileName:source.sourceFileName,sourceSha256:source.sourceSha256,publicPricesPreserved:true,updatedCount:updated.length,unchangedCount:unchanged.length,matchedRows:used.size,updated,unchanged,pendingVersions,pendingRows:source.rows.filter(row=>!used.has(rowKey(row))).map(row=>({family:row[0],modelYear:row[1],description:row[2],code:row[3],conditionPercent:row[4],reason:'Sem correspondência segura e integral no catálogo; preço final depende de cadastro/preço base e revisão'})), publicPricesBefore:before}
  }, { timeout: 60000 })
  writeFileSync('data/reports/conditions-october-2026-import.json', JSON.stringify(report,null,2)+'\n')
  // Export through the very same service used by the live API and existing Vercel build.
  const { CatalogService } = await import('../server/catalog.service.js')
  const service = new CatalogService()
  const summaries = await service.vehicles({})
  const details = await Promise.all(summaries.map(model => service.model(model.slug)))
  writeFileSync('data/generated/api-fixtures.json', JSON.stringify({summaries,details},null,2)+'\n')
  console.log({updated:report.updatedCount,unchanged:report.unchangedCount,matchedRows:report.matchedRows,pendingRows:report.pendingRows.length,publicPricesPreserved:true})
} finally { await prisma.$disconnect() }
