import 'dotenv/config'
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {Prisma} from '@prisma/client'
import {prisma} from '../server/db.js'
import type {Catalog} from './import-chevrolet-catalog.js'

try{
 const catalog:Catalog=JSON.parse(readFileSync('data/generated/october-prices.json','utf8'))
 const pdf=process.env.PUBLIC_PRICES_PDF||`data/sources/monthly/${catalog.source.fileName}`
 if(createHash('sha256').update(readFileSync(pdf)).digest('hex')!==catalog.source.sha256)throw new Error('Hash da lista pública divergente')
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(1740240)`
  const source=await tx.sourceDocument.upsert({where:{sha256:catalog.source.sha256},create:{...catalog.source,documentDate:new Date('2026-10-02')},update:{}})
  let changed=0,unchanged=0
  for(const model of catalog.models)for(const version of model.versions){
   const target=await tx.vehicleVersion.findFirstOrThrow({where:{slug:version.slug,active:true,model:{slug:model.slug,modelYear:model.modelYear}},include:{configurations:true}})
   const identity=(codes:{modelCode:string;optionalCode:string}[])=>codes.map(c=>`${c.modelCode}/${c.optionalCode}`).sort().join(';')
   if(identity(target.configurations)!==identity(version.configurations))throw new Error(`Identidade divergente: ${model.slug}/${version.slug}`)
   if(target.sourceDocumentId===source.id&&target.publicPriceNational.eq(version.publicPriceNational)&&target.publicPriceZfm?.eq(version.publicPriceZfm||'0')){unchanged++;continue}
   const evidence=target.fieldEvidence as Record<string,Prisma.JsonValue>
   const history=Array.isArray(evidence.priceHistory)?evidence.priceHistory:[]
   const previous={publicPriceNational:target.publicPriceNational.toFixed(2),publicPriceZfm:target.publicPriceZfm?.toFixed(2)??null,sourceDocumentId:target.sourceDocumentId,sourcePage:target.sourcePage,effectiveDate:target.effectiveDate.toISOString().slice(0,10),listNumber:target.listNumber,updatedAt:target.updatedAt.toISOString()}
   await tx.vehicleVersion.update({where:{id:target.id},data:{publicPriceNational:new Prisma.Decimal(version.publicPriceNational),publicPriceZfm:version.publicPriceZfm===null?null:new Prisma.Decimal(version.publicPriceZfm),sourceDocumentId:source.id,sourcePage:version.sourcePage,effectiveDate:new Date(version.effectiveDate),listNumber:version.listNumber,rawContent:version.rawContent,matchingRule:version.matchingRule,observations:version.observations,fieldEvidence:{...version.fieldEvidence,priceHistory:[...history,previous]} as Prisma.InputJsonValue}})
   for(const configuration of version.configurations)await tx.vehicleConfiguration.update({where:{vehicleVersionId_modelCode_configurationCode_optionalCode:{vehicleVersionId:target.id,modelCode:configuration.modelCode,configurationCode:configuration.configurationCode,optionalCode:configuration.optionalCode}},data:{sourcePage:configuration.sourcePage,rawContent:configuration.rawContent}})
   await tx.versionPaintColor.updateMany({where:{vehicleVersionId:target.id},data:{available:false}})
   for(const color of version.colors){
    const palette:Record<string,string>={azul:'#174b83',branco:'#f3f2ee',preto:'#171819',cinza:'#767c83',prata:'#bdc1c7',vermelho:'#a61e2b',amarelo:'#edc834',dourado:'#b8a07b'}
    const paint=await tx.paintColor.upsert({where:{slug:color.slug},create:{slug:color.slug,name:color.name,normalizedName:color.slug,paintType:color.paintType,hexApproximation:palette[color.slug.split('-')[0]]||'#a2a5ab'},update:{}})
    const data={additionalPriceNational:new Prisma.Decimal(color.additionalPriceNational),additionalPriceZfm:color.additionalPriceZfm===null?null:new Prisma.Decimal(color.additionalPriceZfm),available:true,allowedOptionalCodes:color.allowedOptionalCodes,sourcePage:color.sourcePage}
    await tx.versionPaintColor.upsert({where:{vehicleVersionId_paintColorId:{vehicleVersionId:target.id,paintColorId:paint.id}},create:{...data,vehicleVersionId:target.id,paintColorId:paint.id},update:data})
   }
   changed++
  }
  return {updated:changed,unchanged,versions:catalog.models.reduce((n,m)=>n+m.versions.length,0),sourceSha256:catalog.source.sha256}
 },{timeout:120000})
 mkdirSync('.local/history',{recursive:true})
 const existing:Catalog=JSON.parse(readFileSync('data/generated/chevrolet-catalog.json','utf8'))
 if(existing.source.sha256!==catalog.source.sha256)copyFileSync('data/generated/chevrolet-catalog.json',`.local/history/catalog-${existing.source.sha256}.json`)
 writeFileSync('data/generated/chevrolet-catalog.json',JSON.stringify(catalog,null,2)+'\n')
 writeFileSync('data/reports/october-price-import.json',JSON.stringify(result,null,2)+'\n')
 console.log(result)
}finally{await prisma.$disconnect()}
