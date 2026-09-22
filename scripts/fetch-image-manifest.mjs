import fs from 'node:fs/promises'
const d=JSON.parse(await fs.readFile('data/extracted/vedo-tracker.json','utf8'))
const r=await fetch(d.assetBaseUrl+'/2d/manifest.json',{signal:AbortSignal.timeout(25000)})
console.log('manifest',r.status)
if(r.ok){const value=await r.json();await fs.writeFile('data/extracted/vedo-tracker-images.json',JSON.stringify(value));console.log(JSON.stringify(value).slice(0,2200))}
for(const [slug,url] of [['spin','https://www.chevrolet.com.br/suvs/spin'],['montana','https://www.chevrolet.com.br/picapes/montana'],['sonic-3d','https://www.chevrolet.com.br/suvs/sonic/visualizer-3d']]) {
 const response=await fetch(url,{signal:AbortSignal.timeout(25000)});console.log(slug,response.status)
 if(response.ok){const html=await response.text();await fs.writeFile(`data/extracted/image-page-${slug}.html`,html);console.log('endpoints',html.match(/data-trims-json-endpoint="[^"]+"|project-id="[^"]+"/g))}
}
