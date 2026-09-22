import fs from 'node:fs/promises'
const origin='https://www.chevrolet.com.br'
const home=await fetch(origin,{signal:AbortSignal.timeout(20000)}).then(r=>r.text())
for(const slug of ['spin','montana']){
 const links=[...new Set([...home.matchAll(/href="([^"#?]+)"/g)].map(m=>m[1]).filter(s=>s.includes(slug)&&!s.includes('content/dam')&&!s.includes('pdf')))]
 console.log(slug,links)
 for(const link of links.slice(0,4))try{
  const r=await fetch(new URL(link,origin),{signal:AbortSignal.timeout(15000)});if(!r.ok)continue
  const html=await r.text();const endpoint=html.match(/data-trims-json-endpoint="([^"]+)"/)?.[1]
  if(endpoint){await fs.writeFile(`data/extracted/color-images-${slug}.json`,await fetch(new URL(endpoint.replaceAll('&amp;','&'),origin)).then(r=>r.text()));console.log('colorizer',slug,link);break}
 }catch{}
}
const tracker=JSON.parse(await fs.readFile('data/extracted/vedo-tracker.json','utf8'))
const source=await fs.readFile('data/extracted/global-colorizer.js','utf8')
const start=source.indexOf('function p9e');console.log(source.slice(start,start+1200))
console.log('image configuration keys',Object.keys(tracker.configurationData[Object.keys(tracker.configurationData)[0]]).filter(k=>/image|color|paint|exterior/i.test(k)))
const s10=await fs.readFile('data/extracted/image-page-s10.html','utf8');const endpoint=s10.match(/data-trims-json-endpoint="([^"]+)"/)?.[1]
if(endpoint)await fs.writeFile('data/extracted/color-images-s10.json',await fetch(new URL(endpoint.replaceAll('&amp;','&'),origin)).then(r=>r.text()))
