import 'dotenv/config'
import {readFileSync,writeFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {prisma} from '../server/db.js'
import {CatalogService} from '../server/catalog.service.js'
import {calculatePrice,resolveCondition} from '#conditions'

try {
 const report=JSON.parse(readFileSync('data/reports/conditions-october-2026-import.json','utf8'))
 const initialReport=JSON.parse(JSON.stringify(report))
 const priceSnapshot=JSON.stringify(await prisma.vehicleVersion.findMany({orderBy:{id:'asc'}}))
 execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/import-october-prices.ts'],{stdio:'inherit'})
 assert.ok(priceSnapshot===JSON.stringify(await prisma.vehicleVersion.findMany({orderBy:{id:'asc'}})),'Preços/histórico alterados na reimportação')
 const before=await prisma.versionDiscount.findMany({orderBy:{vehicleVersionId:'asc'}})
 const snapshot=JSON.stringify(before)
 execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/import-october-conditions.ts'],{stdio:'inherit'})
 const after=await prisma.versionDiscount.findMany({orderBy:{vehicleVersionId:'asc'}})
 assert.ok(JSON.stringify(after)===snapshot,'Reimportação modificou IDs/percentuais/histórico/timestamps')
 const repeat=JSON.parse(readFileSync('data/reports/conditions-october-2026-import.json','utf8'))
 assert.equal(repeat.updatedCount,0);assert.equal(repeat.unchangedCount,report.updatedCount+report.unchangedCount)
 const service=new CatalogService()
 let colorCalculations=0
 for(const old of report.publicPricesBefore){
  const v=await prisma.vehicleVersion.findUniqueOrThrow({where:{id:old.id},include:{model:true}})
  assert.equal(v.publicPriceNational.toFixed(2),old.publicPriceNational)
  assert.equal(v.publicPriceZfm?.toFixed(2)??null,old.publicPriceZfm)
  assert.equal(v.model.modelYear,old.modelYear)
  const api=await service.version(v.id)
  const rate=resolveCondition(api.discount)
  for(const color of api.colors){const expected=rate===null?null:calculatePrice(color.finalPrice,rate);assert.equal(color.corporatePrice,expected?.corporatePrice??null);assert.equal(color.discountAmount,expected?.discountAmount??null);colorCalculations++}
 }
 const validation={idempotent:true,discountRecords:after.length,publicPricesPreserved:report.publicPricesBefore.length,colorCalculations,updated:report.updatedCount+report.unchangedCount,pendingRows:report.pendingRows.length}
 writeFileSync('data/reports/conditions-october-2026-validation.json',JSON.stringify(validation,null,2)+'\n')
 // Keep the original first-run report for review, rather than replacing counts with the idempotence run.
 writeFileSync('data/reports/conditions-october-2026-import.json',JSON.stringify({...initialReport,validation},null,2)+'\n')
 console.log(validation)
}finally{await prisma.$disconnect()}
