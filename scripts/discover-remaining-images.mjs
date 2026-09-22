import fs from 'node:fs/promises'
const origin='https://www.chevrolet.com.br'
const tracker=JSON.parse(await fs.readFile('data/extracted/vedo-tracker.json','utf8'))
try {const r=await fetch(tracker.assetBaseUrl+'/optimized/2d/manifest.json',{signal:AbortSignal.timeout(25000)});console.log('tracker manifest',r.status);if(r.ok){const d=await r.json();await fs.writeFile('data/extracted/vedo-tracker-images.json',JSON.stringify(d));console.log(JSON.stringify(d).slice(0,2000))}}catch(e){console.log(String(e))}
for(const slug of ['sonic','onix','onix-plus','spin','montana','s10','spark-euv']){
 try {
  const url=`${origin}/modelos/monte-o-seu/${slug}`
  const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok){console.log(slug,r.status);continue}
  const html=await r.text();await fs.writeFile(`data/extracted/configurator-${slug}.html`,html)
  console.log(slug,[...new Set(html.match(/https:[^"\s<>]*(?:\.json|image\.gen)[^"\s<>]*/g)||[])].slice(0,3))
  console.log('configuration paths',[...new Set(html.match(/[^"\s<>]*?(?:\.json|\.js)[^"\s<>]*/g)||[])].filter(s=>/config|model|vehicle|main\.|index-/i.test(s)).slice(0,12))
 }catch(error){console.log(slug,String(error))}
}
try {const r=await fetch(`${origin}/suvs/sonic/visualizer-3d`);const html=await r.text();const id=html.match(/project-id="([^"]+)"/)?.[1];console.log('sonic project',id);if(id){const d=await fetch(`https://vedo.ext.gm.com/app/delivery/v2/experience/${id}`).then(r=>r.json());await fs.writeFile('data/extracted/vedo-sonic.json',JSON.stringify(d));const imgs=await fetch(d.assetBaseUrl+'/optimized/2d/manifest.json').then(r=>r.json());await fs.writeFile('data/extracted/vedo-sonic-images.json',JSON.stringify(imgs));console.log(JSON.stringify(imgs).slice(0,1500))}}catch(e){console.log(String(e))}
