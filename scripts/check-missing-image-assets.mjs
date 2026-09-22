import fs from 'node:fs/promises'
const root='https://www.chevrolet.com.br'
const spark='/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/electric/spark-euv/refresh/colorizer/trims/euv/exterior/amarelocanario/spark-euv-amarelo-canario-ext.001'
const s10='/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/pickups-and-trucks/2026-s10/mov/colorizer-360/trims/'
const paths=[spark+'.jpg',spark+'.png',spark.replace('refresh/','')+'.jpg',s10+'wt-mt/exterior/branco-summit/v2-wt-branco-summit-ext.001.png',s10+'chassis-cab/exterior/branco-summit/v2-chassis-branco-summit-ext.001.png',s10+'chassi/exterior/branco-summit/v2-chassi-branco-summit-ext.001.png']
const results=[]
for(const [index,path] of paths.entries()) {
 try {const url=root+path;const response=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error'});const type=response.headers.get('content-type');const result={url,status:response.status,type};results.push(result);if(response.ok&&type?.startsWith('image/')){const file=`data/extracted/audit-candidate-${index}.image`;await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));result.file=file;} console.log(result)}catch(error){results.push({url:root+path,error:String(error)});console.log(String(error))}
}
await fs.writeFile('data/reports/missing-image-search.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2))