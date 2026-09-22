import fs from 'node:fs/promises'
for(const number of [1,2,3,4]){
 const url=`https://news.chevrolet.com.br/content/dam/Media/images/BR/Vehicles/Chevrolet/euv/spark-euv/2026/Chevrolet-2026-Spark-EUV-${number}.jpg`
 const r=await fetch(url,{signal:AbortSignal.timeout(20000)});console.log(number,r.status);if(r.ok)await fs.writeFile(`data/extracted/spark-press-${number}.jpg`,Buffer.from(await r.arrayBuffer()))
}
