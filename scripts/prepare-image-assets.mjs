import fs from 'node:fs/promises'
const sources={onix:'https://www.chevrolet.com.br/carros/novo-onix','onix-plus':'https://www.chevrolet.com.br/carros/novo-onix-plus','spark-euv':'https://www.chevrolet.com.br/eletrico/spark-euv','captiva-ev':'https://www.chevrolet.com.br/eletrico/captiva-ev'}
const trims={onix:{'rs-turbo':['rgn-rgc'],'premier-turbo':['r7r'],'lt-turbo':['r7k','a2a'],'turbo-mt':['rfl'],'mt-turbo':['r7j']},'onix-plus':{'premier-turbo-at':['r8r'],'ltz-turbo-at':['prb'],'turbo-at':['r8b','a4a'],'turbo-mt':['r8g'],'10-mt':['r8a']},'spark-euv':{euv:['pea']},'captiva-ev':{ev:['pea']}}
const normalize=s=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-')
const assets=[]
Object.assign(sources,{spin:'https://www.chevrolet.com.br/suvs/novo-spin',montana:'https://www.chevrolet.com.br/picapes/chevrolet-montana',s10:'https://www.chevrolet.com.br/picapes/s10'})
Object.assign(trims,{spin:{premier:['r6s'],ltz7:['r6r'],ltz5:['r6q'],lt:['r6n'],'18-at':['r6m']},montana:{premier:['rfe'],ltz:['rfd'],lt:['rfc'],mt:['rfa']},s10:{hc:['r7u'],z71:['pqq'],ltz:['r6v'],'wt-at':['r7n'],'cabine-simples':['r9i']}})
for(const [model,page] of Object.entries(sources)) {
 const data=JSON.parse(await fs.readFile(`data/extracted/color-images-${model}.json`,'utf8'))
 for(const trim of data.data.colorizerModelByPath.item.trims)for(const color of trim.exteriors){
  const template=color.flipbook?.desktopImagePathFormat?.replace('{framenumber]','{framenumber}')
  if(!template?.includes('{framenumber}'))continue
  for(const version of trims[model][trim.trimId]||[])assets.push({model,version,color:normalize(color.name),url:new URL(template.replace('{framenumber}','001'),'https://www.chevrolet.com.br').href,sourcePage:page,officialTrim:trim.name,rule:'Exact official trim mapping + normalized official paint name; frame 001 as used by official colorizer'})
 }
}
assets.push(...JSON.parse(await fs.readFile('data/reviewed-image-manifest.json','utf8')))
await fs.writeFile('data/image-manifest.json',JSON.stringify(assets,null,2));console.log('Official color image candidates:',assets.length)
