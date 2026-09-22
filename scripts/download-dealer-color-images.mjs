import fs from 'node:fs/promises'
const root='data/extracted/final-image-search'
const html=await fs.readFile(`${root}/dealer-granleste.html`,'utf8')
const normalize=s=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-')
const manifest=JSON.parse(await fs.readFile('data/image-manifest.json','utf8'))
const candidates=[]
for(const match of html.matchAll(/<input\b[^>]*data-color-image="[^"]+"[^>]*>/g)){
 const attr=n=>match[0].match(new RegExp(`${n}="([^"]*)"`))?.[1]
 const version={'7588':'a3x','7589':'r7y'}[attr('data-version')]
 if(!version)continue
 const color=normalize(attr('data-name'))
 if(manifest.some(i=>i.model==='onix'&&i.version===version&&i.color===color))continue
 candidates.push({model:'onix',version,color,url:attr('data-color-image'),sourcePage:'https://www.granlestegm.com.br/novos/chevrolet-onix',officialTrim:version==='a3x'?'Onix Pro 2027':'Onix Activ Turbo AT 2027',rule:'Authorized Chevrolet dealer color selector explicitly identifies model year, trim and paint for this exact asset.',viewName:'front-3q',file:`${root}/onix-${version}-${color}.webp`})
}
for(let start=0;start<candidates.length;start+=4)await Promise.all(candidates.slice(start,start+4).map(async item=>{const r=await fetch(item.url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${r.status}: ${item.url}`);await fs.writeFile(item.file,Buffer.from(await r.arrayBuffer()));console.log(item.file)}))
await fs.writeFile(`${root}/dealer-color-candidates.json`,JSON.stringify(candidates,null,2))
const extras=[['chassi-2027','https://production.autoforce.com/uploads/version/profile_image/14552/comprar-wt-chassis-cab-pacote-r9d_60bb0fda39.png'],['wt-mt-2027','https://production.autoforce.com/uploads/version/profile_image/14553/comprar-wt-mt-pacote-r7f_8616c88231.png']]
await Promise.all(extras.map(async([name,url])=>{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(String(r.status));await fs.writeFile(`${root}/${name}.png`,Buffer.from(await r.arrayBuffer()));console.log(name)}))
