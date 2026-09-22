import fs from 'node:fs'
const file='data/image-manifest.json';const assets=JSON.parse(fs.readFileSync(file,'utf8'))
const catalog=JSON.parse(fs.readFileSync('data/generated/chevrolet-catalog.json','utf8'))
const normalize=s=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-')
for(const model of catalog.models){
 const source=`data/extracted/vedo-${model.slug}.json`;if(!fs.existsSync(source))continue
 const data=JSON.parse(fs.readFileSync(source,'utf8'))
 for(const [trimKey,trim] of Object.entries(data.configurationData||{})){
  if(Number(trim.carline.modelYear)!==model.modelYear)continue
  const version=model.versions.find(v=>v.configurations.some(c=>`${c.modelCode}_${c.optionalCode}`===trimKey));if(!version)continue
  const configuration=trim.configuration
  const exterior=configuration.urlPatterns?.exterior;if(!exterior)continue
  const options=[...(configuration.options||[]),...(configuration.standardEquipment||[])]
  for(const image of exterior.images){
   const option=options.find(o=>image.options.split('_').includes(o.code) && version.colors.some(c=>c.slug===normalize(o.shortCfd?.pt || '')))
   const name=option?.shortCfd?.pt
   if(!name)continue
   const color=version.colors.find(c=>c.slug===normalize(name));if(!color)continue
   const pattern=exterior.patterns.find(p=>p.patternId===image.patternId);if(!pattern)continue
   const url=pattern.url.replace(pattern.angleReplacement,exterior.defaultAngle).replace(pattern.imageReplacement,image.image.replace(pattern.sizeReplacement,'gmds10'))
   const candidate={model:model.slug,version:version.slug,color:color.slug,url,sourcePage:`https://www.chevrolet.com.br/modelos/monte-o-seu/${model.slug}`,officialTrim:trimKey,rule:'Exact factory model/optional + year + official paint shortCfd matched to PDF name; official CGI urlPattern and default angle'}
   const index=assets.findIndex(a=>a.model===model.slug&&a.version===version.slug&&a.color===color.slug)
   if(index<0)assets.push(candidate)
   // Prefer existing transparent official 360 PNG when both sources identify the same combination.
  }
 }
}
fs.writeFileSync(file,JSON.stringify(assets,null,2));console.log('Image candidates',assets.length)
for(const m of catalog.models)console.log(m.slug,m.versions.flatMap(v=>v.colors.filter(c=>!assets.some(a=>a.model===m.slug&&a.version===v.slug&&a.color===c.slug)).map(c=>`${v.slug}:${c.slug}`)))
