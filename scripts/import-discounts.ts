import 'dotenv/config'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { Prisma } from '@prisma/client'
import { prisma } from '../server/db.js'
import type { Catalog } from './import-chevrolet-catalog.js'
interface Cell {cell:string;value:string;type:string;formula:string|null}
interface Workbook {fileName:string;sha256:string;sheet:string;rows:{row:number;cells:Cell[]}[]}
try {
 execFileSync(process.env.PYTHON_EXECUTABLE||'python',['scripts/extract-discounts.py'],{stdio:'pipe'})
 const book:Workbook=JSON.parse(readFileSync('data/extracted/excel-discounts.json','utf8'))
 const actualFile=readdirSync('data/sources').find(f=>f===book.fileName)!
 if(createHash('sha256').update(readFileSync(`data/sources/${actualFile}`)).digest('hex')!==book.sha256)throw new Error('Hash da planilha inválido')
 const catalog:Catalog=JSON.parse(readFileSync('data/generated/chevrolet-catalog.json','utf8'))
 const title=book.rows.find(r=>r.row===1)!.cells.find(c=>c.cell==='B1')!.value
 const records=[];const discrepancies:unknown[]=[]
 for(const model of catalog.models)for(const version of model.versions){
  const row=book.rows.find(r=>r.row===Number(version.fieldEvidence.excelSelectionRow))
  if(!row)throw new Error(`Linha ausente: ${model.slug}/${version.slug}`)
  const cells=Object.fromEntries(row.cells.map(c=>[c.cell.replace(/\d/g,''),c]))
  if(cells.C?.value.replace(/\s/g,'')!==version.optionalCode)throw new Error(`Código divergente: linha ${row.row}`)
  if(!cells.B.value.toUpperCase().includes(model.name.toUpperCase().replace(' EV','')))throw new Error(`Família divergente: linha ${row.row}`)
  const rawRate=cells.E?.value
  if(!rawRate||cells.E.type!=='n'||cells.E.formula)throw new Error(`Percentual sem valor numérico direto: E${row.row}`)
  const sourceRate=new Prisma.Decimal(rawRate);const rate=sourceRate.toDecimalPlaces(6)
  if(rate.lt(0)||rate.gt(1)||sourceRate.sub(rate).abs().gt('0.000000001'))throw new Error(`Percentual inválido: E${row.row}`)
  if(!new Prisma.Decimal(cells.D.value).eq(version.publicPriceNational))throw new Error(`Preço base Excel/PDF diverge na linha ${row.row}; revisar antes de publicar desconto`)
  const audit=[]
  for(const [base,total] of [['D','G'],['I','K'],['M','O']]){
   if(!cells[base]||!cells[total])continue
   const expected=new Prisma.Decimal(cells[base].value).mul(new Prisma.Decimal(1).sub(rate)).toDecimalPlaces(2)
   const actual=new Prisma.Decimal(cells[total].value).toDecimalPlaces(2)
   if(!actual.eq(expected)){const item={row:row.row,cell:cells[total].cell,stored:actual.toFixed(2),recalculated:expected.toFixed(2),rule:'stored base × (1 − E)'};audit.push(item);discrepancies.push(item)}
  }
  records.push({model:model.slug,version:version.slug,rate:rate.toFixed(6),sourceFileName:book.fileName,sourceSha256:book.sha256,sourceSheet:book.sheet,sourceCell:`E${row.row}`,sourceRow:row.row,sourceTitle:title,rawRate,calculationRule:'(PDF national version price + individual PDF national paint surcharge) × (1 − Excel E rate); discount rounded HALF_UP to cents; public configured price minus rounded discount',audit})
 }
 if(records.length!==40)throw new Error('Esperados 40 descontos')
 await prisma.$transaction(async tx=>{
  await tx.versionDiscount.updateMany({data:{active:false}})
  for(const record of records){const {model,version,...data}=record;const target=await tx.vehicleVersion.findFirstOrThrow({where:{slug:version,active:true,model:{slug:model,active:true}}});await tx.versionDiscount.upsert({where:{vehicleVersionId:target.id},create:{...data,vehicleVersionId:target.id,active:true},update:{...data,active:true}})}
 },{timeout:60000})
 const report={status:'SUCCESS',sourceFileName:book.fileName,sourceSha256:book.sha256,sourceTitle:title,imported:records.length,discrepancies,records}
 writeFileSync('data/reports/discount-import-report.json',JSON.stringify(report,null,2));console.log({imported:records.length,spreadsheetCalculationDiscrepancies:discrepancies.length,rateA3X:records.find(r=>r.version==='a3x')?.rate})
}finally{await prisma.$disconnect()}
