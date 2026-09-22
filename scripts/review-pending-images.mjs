import fs from 'node:fs/promises'
const work='data/extracted/pending-image-review'
await fs.mkdir(work,{recursive:true})
const page='https://news.chevrolet.com.br/newsroom.detail.html/Pages/news/br/pt/2026/jun/0603-onix-2027.html'
const html=await fs.readFile('data/extracted/special-activ.html','utf8')
const images=[...new Set(html.match(/\/content\/dam\/Media\/[^\x22<>\s]*\.jpg/g)||[])].filter(p=>/\/(Onix_log_[123]|Activ_[123])\.jpg$/.test(p))
const report=[]
for(const [index,path] of images.entries()) {
 const url=new URL(path,'https://news.chevrolet.com.br').href
 try {const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(String(r.status));const file=`${work}/${path.split('/').pop()}`;await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));report.push({url,file,page});console.log(file)}catch(error){console.log(index,String(error))}
}
for(const model of ['onix','s10']){
 const page=model==='onix'?'https://www.chevrolet.com.br/carros/novo-onix':'https://www.chevrolet.com.br/picapes/s10'
 try{const html=await fetch(page,{signal:AbortSignal.timeout(15000)}).then(r=>r.text());await fs.writeFile(`${work}/${model}.html`,html);const endpoint=html.match(/data-trims-json-endpoint="([^"]+)"/)?.[1];if(endpoint){const url=new URL(endpoint.replaceAll('&amp;','&'),'https://www.chevrolet.com.br').href;const data=await fetch(url,{signal:AbortSignal.timeout(15000)}).then(r=>r.json());await fs.writeFile(`${work}/${model}-colors.json`,JSON.stringify(data));console.log(model,'TRIMS',data.data.colorizerModelByPath.item.trims.map(t=>[t.trimId,t.name]));}console.log(model,'links',[...new Set(html.match(/[^\x22<>\s]*(?:monte-o-seu|visualizer|chassi|onix-pro|onix-log)[^\x22<>\s]*/gi)||[])].slice(0,15))}catch(e){console.log(String(e))}
}
await fs.writeFile(`${work}/sources.json`,JSON.stringify(report,null,2))