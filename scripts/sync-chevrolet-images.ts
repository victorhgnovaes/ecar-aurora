import 'dotenv/config'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { prisma } from '../server/db.js'
sharp.concurrency(1)
sharp.cache(false)

interface ImageCandidate { viewName?: string; model: string; version: string; color: string; url: string; sourcePage: string; rule: string }
interface UserImage { model: string; version: string; color: string | null; localPath: string; sourceUrl: string; sha256: string; userApproved: boolean; viewName?: string }
const userImages: UserImage[] = JSON.parse(await readFile('data/user-image-overrides.json', 'utf8').catch(error => { if (error.code === 'ENOENT') return '[]'; throw error }))
const candidates: ImageCandidate[] = JSON.parse(await readFile('data/image-manifest.json','utf8'))
const allowedHosts = new Set(['www.chevrolet.com.br','chevrolet.com.br','cgi.chevrolet.com','vedo.ext.gm.com','news.chevrolet.com.br','www.artvelchevrolet.com.br'])
const safe = (value: string) => { if (!/^[a-z0-9-]+$/.test(value)) throw new Error('Identificador de imagem inválido'); return value }
const digest = (value: Buffer) => createHash('sha256').update(value).digest('hex')
const base='https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/'
const neutral: Record<string,{file?:string;url:string}> = {
 onix:{file:'onix.png',url:base+'visid/monte-o-seu/onix.png'},'onix-plus':{file:'onix-plus.png',url:base+'visid/monte-o-seu/onixplus.png'},
 tracker:{file:'tracker.png',url:base+'visid/monte-o-seu/tracker.png'},montana:{file:'montana.png',url:base+'visid/monte-o-seu/montana_2026_jelly.png'},spin:{file:'spin.png',url:base+'visid/monte-o-seu/spin.png'},s10:{file:'s10.jpg',url:base+'portable-navigation/jellys/05-images/s10-2027-flyout-jelly.jpg'},
 sonic:{url:'https://cgi.chevrolet.com/mmgprod-us/dynres/prove/image.gen?country=BR&std=true&v=deg01&i=2027/1EE58/1EE58__PR1/GAZ_V8B_CV2_MDV_H2Ggmds10.jpg'},
}
await mkdir('data/reports',{recursive:true}); await mkdir('data/extracted/image-originals',{recursive:true})
const report: {model:string;version?:string;color?:string;status:string;reason?:string;url?:string;localPath?:string}[]=[]
let downloads=0
async function download(url: string) {
 let current=url
 for(let redirects=0;redirects<4;redirects++) {
  const parsed=new URL(current)
  if(parsed.protocol!=='https:'||!allowedHosts.has(parsed.hostname)||parsed.username||parsed.password)throw new Error('Fonte não oficial recusada')
  const response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(30000)})
  if(response.status>=300&&response.status<400){current=new URL(response.headers.get('location')||'',current).href;continue}
  if(!response.ok)throw new Error(`HTTP ${response.status}`)
  if(!/^image\/(png|jpeg|webp)/.test(response.headers.get('content-type')||''))throw new Error('Resposta não é imagem permitida')
  const length=Number(response.headers.get('content-length')||0);if(length>25000000)throw new Error('Imagem muito grande')
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>25000000)throw new Error('Imagem muito grande')
  downloads++;return bytes
 }
 throw new Error('Redirecionamentos excessivos')
}
async function asset(url:string,directory:string,existing?:string,viewName='front-3q') {
 const localPath=`/assets/vehicles/${directory}/${safe(viewName)}.png`
 let bytes:Buffer
 try {bytes=await readFile(`public${localPath}`)}catch {
  const original=existing ? await readFile(`public/assets/vehicles/${existing}`) : await download(url)
  const metadata=await sharp(original).metadata();if(!metadata.width||!metadata.height)throw new Error('Dimensões inválidas')
  await writeFile(`data/extracted/image-originals/${digest(original)}.${metadata.format}`,original)
  bytes=await sharp(original).resize({width:1400,withoutEnlargement:true}).png({compressionLevel:9}).toBuffer()
  await mkdir(`public/assets/vehicles/${directory}`,{recursive:true});await writeFile(`public${localPath}`,bytes)
 }
 const metadata=await sharp(bytes).metadata()
 return {localPath,originalSourceUrl:url,sourceDomain:new URL(url).hostname,mimeType:'image/png',width:metadata.width!,height:metadata.height!,sha256:digest(bytes),status:'READY'}
}
try {
 const models=await prisma.vehicleModel.findMany({where:{active:true},include:{versions:{where:{active:true},include:{colors:{where:{available:true},include:{color:true}}}}}})
 for(const model of models){
  const directory=`${safe(model.slug)}-${model.modelYear}`
  const reference=neutral[model.slug]
  if(reference)try {
   const data=await asset(reference.url,`${directory}/reference`,reference.file)
   await prisma.vehicleImage.upsert({where:{assetKey:`${model.slug}:neutral`},create:{assetKey:`${model.slug}:neutral`,vehicleModelId:model.id,viewName:'front-3q',...data},update:data})
   report.push({model:model.slug,status:'REFERENCE',url:reference.url,localPath:data.localPath})
  }catch(error){report.push({model:model.slug,status:'MISSING',reason:String(error)})}
  for(const version of model.versions)for(const association of version.colors){
   const color=association.color
   const candidate=candidates.find(c=>c.model===model.slug&&c.version===version.slug&&c.color===color.slug)
   const userImage=userImages.find(i=>i.userApproved && i.model===model.slug && i.version===version.slug && i.color===color.slug)
   const assetKey=`${model.slug}:${version.slug}:${color.slug}:front-3q`
   const viewName=userImage?.viewName || (userImage ? 'front-3q' : candidate?.viewName) || 'front-3q'
   const identity={assetKey,vehicleModelId:model.id,vehicleVersionId:version.id,paintColorId:color.id,viewName}
   try {
    if(!candidate && !userImage)throw new Error('Combinação exata de versão/ano/cor não localizada nas fontes oficiais consultadas')
    const imageDirectory=`${directory}/${safe(version.slug)}/${safe(color.slug)}`
    if(userImage && (userImage.localPath!==`/assets/vehicles/${imageDirectory}/front-3q.png` || digest(await readFile(`public${userImage.localPath}`))!==userImage.sha256))throw new Error('Arquivo fornecido pelo usuário não corresponde ao manifesto aprovado')
    const data=await asset(userImage?.sourceUrl || candidate!.url,imageDirectory,undefined,viewName)
    await prisma.vehicleImage.upsert({where:{assetKey},create:{...identity,...data},update:{...data,viewName:identity.viewName}})
    if(!reference){await prisma.vehicleImage.upsert({where:{assetKey:`${model.slug}:neutral`},create:{assetKey:`${model.slug}:neutral`,vehicleModelId:model.id,viewName:'front-3q',...data},update:{}})}
    report.push({model:model.slug,version:version.slug,color:color.slug,status:'READY',url:data.originalSourceUrl,localPath:data.localPath})
   }catch(error){
    await prisma.vehicleImage.upsert({where:{assetKey},create:{...identity,status:'MISSING'},update:{status:'MISSING',localPath:null}})
    report.push({model:model.slug,version:version.slug,color:color.slug,status:'MISSING',reason:String(error),url:candidate?.url})
   }
  }
  for(const reference of userImages.filter(i=>i.userApproved&&i.model===model.slug&&i.color===null)){
   const version=model.versions.find(v=>v.slug===reference.version)
   if(!version)throw new Error('Versão da referência fornecida não encontrada')
   const expected=`/assets/vehicles/${directory}/${safe(version.slug)}/reference.png`
   if(reference.localPath!==expected)throw new Error('Caminho de referência inválido')
   const bytes=await readFile(`public${expected}`)
   if(digest(bytes)!==reference.sha256)throw new Error('Checksum de referência inválido')
   const metadata=await sharp(bytes).metadata()
   const data={vehicleModelId:model.id,vehicleVersionId:version.id,paintColorId:null,viewName:'reference',localPath:expected,originalSourceUrl:reference.sourceUrl,sourceDomain:new URL(reference.sourceUrl).hostname,mimeType:'image/png',width:metadata.width!,height:metadata.height!,sha256:reference.sha256,status:'READY'}
   const assetKey=`${model.slug}:${version.slug}:reference`
   await prisma.vehicleImage.upsert({where:{assetKey},create:{assetKey,...data},update:data})
  }
  console.log(model.slug,'concluído')
 }
 const result={generatedAt:new Date().toISOString(),downloads,ready:report.filter(r=>r.status==='READY').length,missing:report.filter(r=>r.status==='MISSING').length,assets:report}
 await writeFile('data/reports/image-assets-report.json',JSON.stringify(result,null,2));console.log({downloads,ready:result.ready,missing:result.missing})
} finally {await prisma.$disconnect()}
