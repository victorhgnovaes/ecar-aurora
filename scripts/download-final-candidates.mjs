import fs from 'node:fs/promises'
const items=[
{name:'onix-pro',url:'https://www.artvelchevrolet.com.br/content/dam/chevrolet/sa/br/pt/master/home/cars/onix/onix-2027/04-versoes/chevrolet-onix-pro-2027.jpg'},
{name:'s10-wt-mt',url:'https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/pickups-and-trucks/2026-s10/mov/refresh-2027/versiones/1/wt-mt-card-versoes-2027.jpeg'},
{name:'s10-chassi',url:'https://cotac.com.br/wp-content/uploads/2024/02/S10-Chassi-pra-todo-tipo-de-trabalho.webp'}]
await Promise.all(items.map(async i=>{const r=await fetch(i.url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${i.name}: ${r.status}`);await fs.writeFile(`data/extracted/final-image-search/${i.name}.image`,Buffer.from(await r.arrayBuffer()));console.log(i.name,r.status)}))
await fs.writeFile('data/extracted/final-image-search/candidates.json',JSON.stringify(items,null,2))
