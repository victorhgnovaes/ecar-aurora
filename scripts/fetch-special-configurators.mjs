import fs from 'node:fs/promises'
const origin='https://www.chevrolet.com.br'
const home=await fetch(origin).then(r=>r.text());const links=[...new Set([...home.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(s=>s.includes('/modelos/monte-o-seu/')&&/s10|spark|onix/.test(s)))];console.log(links)
for(const link of links){
 const response=await fetch(new URL(link,origin),{signal:AbortSignal.timeout(25000)});if(!response.ok)continue
 const html=await response.text();const chunks=[...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)].map(m=>JSON.parse(m[1])).join('');const id=chunks.match(/"vedoId":"([^"]+)"/)?.[1]
 const slug=link.split('/').pop();console.log(slug,id)
 if(id){const d=await fetch(`https://vedo.ext.gm.com/app/delivery/v2/experience/${id}`,{signal:AbortSignal.timeout(25000)}).then(r=>r.json());await fs.writeFile(`data/extracted/vedo-${slug==='spark'?'spark-euv':slug}.json`,JSON.stringify(d));console.log('image trims',Object.keys(d.configurationData||{}))}
}
