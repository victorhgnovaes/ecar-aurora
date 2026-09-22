import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { Prisma } from '@prisma/client'
import { prisma } from '../server/db.js'

export interface CatalogColor { name: string; slug: string; paintType: string | null; additionalPriceNational: string; additionalPriceZfm: string | null; sourcePage: number; allowedOptionalCodes: string[]; sourceText: string }
export interface CatalogVersion { slug: string; name: string; displayName: string; modelCode: string; configurationCode: string; optionalCode: string; engine: string | null; transmission: string | null; fuel: string | null; seatCount: number | null; rawContent: string; publicPriceNational: string; publicPriceZfm: string | null; sourcePage: number; listNumber: string; effectiveDate: string; sortOrder: number; fieldEvidence: Record<string, string | null>; matchingRule: string; observations: string; configurations: { modelCode: string; configurationCode: string; optionalCode: string; sourcePage: number; rawContent: string }[]; colors: CatalogColor[] }
export interface CatalogModel { slug: string; name: string; displayName: string; modelYear: number; category: string; sortOrder: number; versions: CatalogVersion[] }
export interface Catalog { source: { fileName: string; sha256: string; pageCount: number }; models: CatalogModel[] }
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
const python = process.env.PYTHON_EXECUTABLE || 'python'
mkdirSync('data/reports', { recursive: true })
let runId: string | undefined
try {
  const pdfs = readdirSync('data/sources').filter(p => p.endsWith('.pdf'))
  if (pdfs.length !== 1) throw new Error('Esperado um PDF de origem em data/sources')
  const sourceSha256 = hash(`data/sources/${pdfs[0]}`)
  const run = await prisma.importRun.create({ data: { status: 'STARTED', sourceSha256 } }); runId = run.id
  let unchanged = false
  if (existsSync('data/extracted/source-manifest.json')) {
    const manifest = JSON.parse(readFileSync('data/extracted/source-manifest.json', 'utf8'))
    unchanged = [manifest.pdf, manifest.workbook, ...manifest.images].every((source: { fileName: string; sha256: string }) => existsSync(`data/sources/${source.fileName}`) && hash(`data/sources/${source.fileName}`) === source.sha256)
  }
  if (!unchanged || !existsSync('data/extracted/pdf-tables.json')) {
    for (const script of ['extract-sources.py','extract-tables.py','render-sources.py']) execFileSync(python, [`scripts/${script}`], { stdio: 'inherit' })
  }
  execFileSync(python, ['scripts/build-catalog.py'], { stdio: 'inherit' })
  const catalog: Catalog = JSON.parse(readFileSync('data/generated/chevrolet-catalog.json','utf8'))
  if (catalog.source.sha256 !== sourceSha256 || catalog.models.length !== 9 || catalog.models.reduce((n,m) => n + m.versions.length,0) !== 40) throw new Error('Contagem/hash inválidos: nenhuma publicação realizada')
  const result = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(1740240)`
    const source = await tx.sourceDocument.upsert({ where: { sha256: catalog.source.sha256 }, create: { ...catalog.source, documentDate: new Date('2026-07-30') }, update: {} })
    await tx.versionDiscount.updateMany({ where: { version: { sourceDocumentId: { not: source.id } } }, data: { active: false } })
    await tx.vehicleModel.updateMany({ data: { active: false } })
    await tx.vehicleVersion.updateMany({ data: { active: false } })
    let versionsImported = 0; let configurations = 0; let colorAssociations = 0
    for (const m of catalog.models) {
      const { versions, ...modelData } = m
      const model = await tx.vehicleModel.upsert({ where: { slug: m.slug }, create: { ...modelData, active: true }, update: { ...modelData, active: true } })
      for (const v of versions) {
        const { colors, configurations: configs, ...fields } = v
        const data = { ...fields, effectiveDate: new Date(v.effectiveDate), publicPriceNational: new Prisma.Decimal(v.publicPriceNational), publicPriceZfm: v.publicPriceZfm === null ? null : new Prisma.Decimal(v.publicPriceZfm), sourceDocumentId: source.id, vehicleModelId: model.id, active: true }
        const version = await tx.vehicleVersion.upsert({ where: { vehicleModelId_slug: { vehicleModelId: model.id, slug: v.slug } }, create: data, update: data })
        await tx.vehicleConfiguration.deleteMany({ where: { vehicleVersionId: version.id, NOT: { OR: configs.map(c => ({ modelCode: c.modelCode, configurationCode: c.configurationCode, optionalCode: c.optionalCode })) } } })
        for (const configuration of configs) {
          const identity = { vehicleVersionId: version.id, modelCode: configuration.modelCode, configurationCode: configuration.configurationCode, optionalCode: configuration.optionalCode }
          await tx.vehicleConfiguration.upsert({ where: { vehicleVersionId_modelCode_configurationCode_optionalCode: identity }, create: { ...configuration, vehicleVersionId: version.id }, update: configuration })
        }
        configurations += configs.length
        await tx.versionPaintColor.updateMany({ where: { vehicleVersionId: version.id }, data: { available: false } })
        for (const c of colors) {
          const palette: Record<string,string> = { azul:'#174b83', branco:'#f3f2ee', preto:'#171819', cinza:'#767c83', prata:'#bdc1c7', vermelho:'#a61e2b', amarelo:'#edc834', dourado:'#b8a07b' }
          const paintData = { name: c.name, normalizedName: c.slug, paintType: c.paintType, hexApproximation: palette[c.slug.split('-')[0]] || '#a2a5ab' }
          const color = await tx.paintColor.upsert({ where: { slug: c.slug }, create: { slug: c.slug, ...paintData }, update: paintData })
          const colorData = { additionalPriceNational: new Prisma.Decimal(c.additionalPriceNational), additionalPriceZfm: c.additionalPriceZfm === null ? null : new Prisma.Decimal(c.additionalPriceZfm), sourcePage: c.sourcePage, allowedOptionalCodes: c.allowedOptionalCodes, available: true }
          await tx.versionPaintColor.upsert({ where: { vehicleVersionId_paintColorId: { vehicleVersionId: version.id, paintColorId: color.id } }, create: { vehicleVersionId: version.id, paintColorId: color.id, ...colorData }, update: colorData }); colorAssociations++
        }
        versionsImported++
      }
    }
    return { models: catalog.models.length, versionsImported, configurations, colorAssociations, colors: await tx.paintColor.count() }
  }, { timeout: 120000 })
  const report = { status: 'SUCCESS', sourceSha256, ...result, ambiguousMatches: 0, missingMatches: 0, pagesUsed: [...new Set(catalog.models.flatMap(m => m.versions.map(v => v.sourcePage)))].sort((a,b) => a-b), completedAt: new Date().toISOString() }
  writeFileSync('data/reports/catalog-import-report.json',JSON.stringify(report,null,2))
  await prisma.importRun.update({ where: { id: runId }, data: { status: 'SUCCESS', finishedAt: new Date(), modelsFound: 9, versionsFound: 40, versionsImported: 40, reportPath: 'data/reports/catalog-import-report.json' } })
  console.log(report)
} catch (error) {
  let matches: { missing?: unknown[]; ambiguous?: unknown[] } = {}
  if (existsSync('data/reports/catalog-match-report.json')) matches = JSON.parse(readFileSync('data/reports/catalog-match-report.json','utf8'))
  if (runId) await prisma.importRun.update({ where: { id: runId }, data: { status: 'FAILED', finishedAt: new Date(), missingMatches: matches.missing?.length || 0, ambiguousMatches: matches.ambiguous?.length || 0 } })
  console.error(error instanceof Error ? error.message : 'Falha na importação'); process.exitCode = 1
} finally { await prisma.$disconnect() }
