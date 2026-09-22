import 'dotenv/config'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { prisma } from '../server/db.js'
import type { Catalog } from './import-chevrolet-catalog.js'
const normalize = (s: string) => s.replace(/\s+/g, '').normalize('NFC')
const catalog: Catalog = JSON.parse(await readFile('data/generated/chevrolet-catalog.json', 'utf8'))
const pages: {page:number;text:string}[] = JSON.parse(await readFile('data/extracted/pdf-pages.json', 'utf8'))
const errors: string[] = []
const sourceChecks = []
for (const model of catalog.models) for (const version of model.versions) {
 const text = normalize(pages.find(p => p.page === version.sourcePage)!.text)
 for (const field of ['engine','transmission','fuel','seatCount']) {
  const evidence = version.fieldEvidence[field]
  if (evidence && !text.includes(normalize(evidence))) errors.push(`Evidência ausente: ${model.slug}/${version.slug}/${field}`)
 }
 for (const color of version.colors) if (!text.includes(normalize(color.sourceText))) errors.push(`Pintura sem evidência: ${model.slug}/${version.slug}/${color.slug}`)
 sourceChecks.push({model:model.slug,version:version.slug,page:version.sourcePage,list:version.listNumber,effectiveDate:version.effectiveDate})
}
async function scan(directory: string): Promise<string[]> {
 const entries = await readdir(directory, {withFileTypes:true})
 return (await Promise.all(entries.map(e => e.isDirectory() ? scan(`${directory}/${e.name}`) : [`${directory}/${e.name}`]))).flat()
}
try {
 const images = await prisma.vehicleImage.findMany({include:{model:true,version:true,color:true}})
 const missing = images.filter(i=>i.status==='MISSING' && i.version?.active).map(i=>({model:i.model.slug,version:i.version!.slug,color:i.color?.name}))
 const ready = images.filter(i=>i.status==='READY' && i.paintColorId && i.version?.active)
 const duplicates = ready.filter((i,index)=>ready.some((other,j)=>j<index && other.vehicleVersionId===i.vehicleVersionId && other.paintColorId!==i.paintColorId && other.sha256===i.sha256)).map(i=>i.assetKey)
 if (duplicates.length) errors.push(`Imagem idêntica atribuída a cores distintas: ${duplicates.join(', ')}`)
 const exposed = (await scan('public')).filter(p=>/\.(pdf|xlsx?|xlsm|csv)$/i.test(p))
 if (exposed.length) errors.push(`Documento interno público: ${exposed.join(', ')}`)
 const report = {generatedAt:new Date().toISOString(),status:errors.length?'FAILED':missing.length?'PASS_WITH_ASSET_GAPS':'PASS',errors,models:catalog.models.length,versions:sourceChecks.length,sourceChecks,images:{ready:ready.length,versionReferences:images.filter(i=>i.status==='READY'&&i.vehicleVersionId&&!i.paintColorId).length,missing:missing.length,pending:missing,duplicateColors:duplicates},privateDocumentsExposed:exposed}
 await writeFile('data/reports/site-audit.json',JSON.stringify(report,null,2))
 console.log(JSON.stringify({status:report.status,errors,models:report.models,versions:report.versions,images:{ready:ready.length,missing:missing.length}},null,2))
 if (errors.length) process.exitCode=1
} finally {await prisma.$disconnect()}