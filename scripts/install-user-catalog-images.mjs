import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const downloads=process.argv[2] || 'C:/Users/vihnd/Downloads'
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const catalog=JSON.parse(await fs.readFile('data/generated/chevrolet-catalog.json','utf8'))
const entries=JSON.parse(await fs.readFile('data/user-image-overrides.json','utf8'))
const digest=b=>createHash('sha256').update(b).digest('hex')
const files=(await fs.readdir(downloads)).filter(f=>/\.(png|webp)$/i.test(f)&&(/A5F|A3X|R7Y|R7F|R9D/i.test(f)||f==='pratashark.png'))
if(files.length!==19)throw Error(`Esperadas 19 imagens identificadas; encontradas ${files.length}.`)
await fs.mkdir('data/extracted/user-catalog-originals',{recursive:true})
const installed=[]
for(const file of files){
 const version=file==='pratashark.png'?'a5f':file.match(/A5F|A3X|R7Y|R7F|R9D/i)[0].toLowerCase()
 const model=['r7f','r9d'].includes(version)?'s10':'onix'
 const vehicle=catalog.models.find(m=>m.slug===model)
 const trim=vehicle.versions.find(v=>v.slug===version)
 const name=normalize(file)
 let color=trim.colors.find(c=>name.includes(normalize(c.name)))?.slug
 if(!color)color=name.includes('prata')?'prata-shark':name.includes('preto')?'preto-ouro-negro':name.includes('branco')?'branco-summit':name.includes('azul')?'azul-boreal':undefined
 if(!color||!trim.colors.some(c=>c.slug===color))throw Error(`Cor não identificada: ${file}`)
 const original=await fs.readFile(path.join(downloads,file))
 const originalSha256=digest(original)
 const originalPath=`data/extracted/user-catalog-originals/${originalSha256}${path.extname(file)}`
 await fs.writeFile(originalPath,original)
 const bytes=await sharp(original).resize({width:1400,withoutEnlargement:true}).png({compressionLevel:9}).toBuffer()
 const base=`/assets/vehicles/${model}-${vehicle.modelYear}/${version}`
 const localPath=`${base}/${color}/front-3q.png`
 const common={model,version,sourceUrl:pathToFileURL(path.resolve(downloads,file)).href,originalFileName:file,originalPath,sha256:digest(bytes),originalSha256,userApproved:true,approvedAt:new Date().toISOString(),approval:'Imagem fornecida pelo usuário e associação solicitada pelos nomes de versão e cor. Origem web não informada.',viewName:'front-3q'}
 const additions=[{...common,color,localPath}]
 if(['r7y','r9d'].includes(version))additions.push({...common,color:null,localPath:`${base}/reference.png`,viewName:'reference',approval:'Foto do modelo fornecida pelo usuário; usar como referência nas cores sem foto e orientar consulta à Ecar.'})
 for(const entry of additions){
  await fs.mkdir(path.dirname(`public${entry.localPath}`),{recursive:true})
  await fs.writeFile(`public${entry.localPath}`,bytes)
  const index=entries.findIndex(e=>e.model===model&&e.version===version&&e.color===entry.color)
  if(index<0)entries.push(entry);else entries[index]=entry
 }
 installed.push({file,model,version,color,localPath})
}
await fs.writeFile('data/user-image-overrides.json',JSON.stringify(entries,null,2))
await fs.writeFile('data/reports/user-catalog-images.json',JSON.stringify({installedAt:new Date().toISOString(),count:installed.length,installed},null,2))
console.log(`Instaladas ${installed.length} imagens e 2 referências de versão.`)
