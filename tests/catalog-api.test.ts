import 'dotenv/config'
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../server/db.js'
import { CatalogService } from '../server/catalog.service.js'
import type { Catalog } from '../scripts/import-chevrolet-catalog.js'
import { calculatePrice, resolveCondition } from '#conditions'

const catalog: Catalog = JSON.parse(readFileSync('data/generated/chevrolet-catalog.json','utf8'))
const service=new CatalogService()
after(()=>prisma.$disconnect())
test('exatamente 9 famílias e 40 versões autorizadas; códigos repetidos independentes',async()=>{
 const models=await prisma.vehicleModel.findMany({where:{active:true},include:{versions:{where:{active:true}}}})
 assert.equal(models.length,9);assert.equal(models.flatMap(m=>m.versions).length,40)
 assert.deepEqual(models.map(m=>m.slug).sort(),catalog.models.map(m=>m.slug).sort())
 const repeated=models.flatMap(m=>m.versions).filter(v=>v.optionalCode==='PEA');assert.equal(repeated.length,2);assert.notEqual(repeated[0].id,repeated[1].id)
 for(const m of models)assert(!/trailblazer|equinox|silverado|blazer/.test(m.slug))
})
test('preços Decimal, conteúdo original, página, hash e campos só do PDF',async()=>{
 const file=existsSync(`data/sources/monthly/${catalog.source.fileName}`)?`data/sources/monthly/${catalog.source.fileName}`:`data/sources/${catalog.source.fileName}`
 const hash=createHash('sha256').update(readFileSync(file)).digest('hex')
 assert.equal(hash,catalog.source.sha256)
 const models=await prisma.vehicleModel.findMany({where:{active:true},include:{versions:{where:{active:true},include:{sourceDocument:true,colors:{where:{available:true},include:{color:true}},configurations:true}}}})
 for(const model of models)for(const version of model.versions){
  const original=catalog.models.find(m=>m.slug===model.slug)!.versions.find(v=>v.slug===version.slug)!
  assert.equal(version.sourcePage,original.sourcePage);assert(version.sourcePage>0);assert.equal(version.sourceDocument.sha256,hash)
  assert(Prisma.Decimal.isDecimal(version.publicPriceNational));assert.equal(version.publicPriceNational.toFixed(2),original.publicPriceNational)
  assert.equal(version.rawContent,original.rawContent);assert.equal(version.engine,original.engine);assert.equal(version.fuel,original.fuel);assert.equal(version.transmission,original.transmission);assert.equal(version.seatCount,original.seatCount)
  assert.equal(version.colors.length,original.colors.length);assert.equal(new Set(version.colors.map(c=>c.paintColorId)).size,version.colors.length)
  for(const color of version.colors){const source=original.colors.find(c=>c.slug===color.color.slug)!;assert(Prisma.Decimal.isDecimal(color.additionalPriceNational));assert.equal(color.additionalPriceNational.toFixed(2),source.additionalPriceNational)}
 }
 const columns=await prisma.$queryRaw<{data_type:string}[]>`SELECT data_type FROM information_schema.columns WHERE table_name='vehicle_versions' AND column_name='public_price_national'`
 assert.equal(columns[0].data_type,'numeric')
})
test('restrições de pintura Sonic RS são preservadas por código',async()=>{
 const sonic=await service.model('sonic');const rs=sonic.versions.find(v=>v.optionalCode==='R8D/RGD')!
 assert.equal(rs.colors.length,4)
 assert.deepEqual(rs.colors.find(c=>c.name==='Preto Ouro Negro')!.allowedOptionalCodes,['RGD'])
 assert.deepEqual(rs.colors.find(c=>c.name==='Branco Summit')!.allowedOptionalCodes,['R8D'])
})
test('API calcula preço nacional + cada pintura com Decimal e gera fixtures reais',async()=>{
 const summaries=await service.vehicles({});const details=await Promise.all(summaries.map(m=>service.model(m.slug)))
 for(const model of details)for(const version of model.versions)for(const color of version.colors)assert.equal(color.finalPrice,new Prisma.Decimal(version.publicPriceNational).plus(color.additional).toFixed(2))
 writeFileSync('data/generated/api-fixtures.json',JSON.stringify({summaries,details},null,2))
 assert.equal((await service.vehicles({category:'Picape'})).length,2)
 assert.equal((await service.vehicles({search:'inexistente'})).length,0)
 await assert.rejects(()=>service.model('inexistente'))
})
test('imagens locais têm origem oficial ou aprovação explícita, checksum e dimensões reais',async()=>{
 const images=await prisma.vehicleImage.findMany({where:{status:'READY'}});assert(images.length>0)
 const approved: {localPath:string;sha256:string;sourceUrl:string;userApproved:boolean}[] = JSON.parse(readFileSync('data/user-image-overrides.json','utf8'))
 for(const image of images){assert(image.localPath?.startsWith('/assets/vehicles/'));assert(['www.chevrolet.com.br','chevrolet.com.br','cgi.chevrolet.com','vedo.ext.gm.com','news.chevrolet.com.br'].includes(image.sourceDomain!) || approved.some(a=>a.userApproved && a.localPath===image.localPath && a.sha256===image.sha256 && a.sourceUrl===image.originalSourceUrl));assert(image.width!>0&&image.height!>0);assert.equal(createHash('sha256').update(readFileSync(`public${image.localPath}`)).digest('hex'),image.sha256)}
})
test('descontos de outubro preservam base, histórico e condições fora do documento; API calcula com a condição efetiva',async()=>{
 const discounts=await prisma.versionDiscount.findMany({where:{active:true},include:{version:{include:{model:true}}}})
 assert.equal(discounts.length,40)
 assert.equal(discounts.find(d=>d.version.slug==='a3x')!.rate.toFixed(6),'0.019000')
 const source=JSON.parse(readFileSync('data/conditions/chevrolet-aurora-2026-10.json','utf8'))
 const imported=discounts.filter(d=>d.sourceSha256===source.sourceSha256)
 assert(imported.length>0)
 const models=await service.vehicles({})
 for(const discount of discounts){
  const version=await service.version(discount.vehicleVersionId)
  if(discount.sourceSha256===source.sourceSha256){
   const audit=discount.audit as {matchedRows:{code:string;modelYear:number;conditionPercent:string}[];history:unknown[];referenceMonth:string}
   assert.equal(audit.referenceMonth,'2026-10');assert(audit.history.length>0)
   for(const row of audit.matchedRows){const original=source.rows.find((r:[string,number,string,string,string])=>r[1]===row.modelYear&&r[3]===row.code);assert(original);assert.equal(row.conditionPercent,original[4]);assert.equal(discount.rate.toFixed(6),new Prisma.Decimal(original[4]).div(100).toFixed(6))}
  }
  const rate=resolveCondition(version.discount)
  for(const color of version.colors){const expected=rate===null?null:calculatePrice(color.finalPrice,rate);assert.equal(color.discountAmount,expected?.discountAmount??null);assert.equal(color.corporatePrice,expected?.corporatePrice??null)}
 }
 for(const model of models){if(!model.offer)continue;const version=await service.version(model.offer.versionId);assert(version.colors.some(c=>c.corporatePrice===model.offer!.corporatePrice&&c.finalPrice===model.offer!.publicPrice))}
 const spark=await service.model('spark-euv');assert.equal(spark.modelYear,2026);assert(spark.versions[0].discount?.pendingReason);assert.equal(spark.offer,null)
})

test('filtro de preço mantém oferta e mínimo dentro da faixa selecionada', async () => {
 const models = await service.vehicles({ minPrice: '130000', maxPrice: '150000' })
 assert(models.length > 0)
 for (const model of models) {
  assert(new Prisma.Decimal(model.minPrice!).gte('130000'))
  assert(new Prisma.Decimal(model.minPrice!).lte('150000'))
  if (model.offer) {
   const version = await service.version(model.offer.versionId)
   assert(new Prisma.Decimal(version.publicPriceNational).gte('130000'))
   assert(new Prisma.Decimal(version.publicPriceNational).lte('150000'))
  }
 }
})
test('filtro manual não inclui automáticas com opção de troca manual', async () => {
 const models = await service.vehicles({ transmission: 'manual' })
 assert(models.length > 0)
 for (const model of models) if (model.offer) {
  const version = await service.version(model.offer.versionId)
  assert.match(version.technical.Transmissão!, /^(Transmissão|Câmbio) manual/i)
 }
 assert(!models.some(model => model.slug === 'tracker'))
})
test('motor preserva texto expresso no PDF sem inventar cilindrada do Tracker', async () => {
 const s10 = await service.model('s10')
 for (const version of s10.versions) assert.match(version.technical.Motorização!, /2\.8L Diesel\s*-\s*4x4/i)
 const tracker = await service.model('tracker')
 for (const version of tracker.versions) assert.equal(version.technical.Motorização, 'Turbo')
})
