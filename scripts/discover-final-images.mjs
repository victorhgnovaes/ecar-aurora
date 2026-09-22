import fs from 'node:fs/promises'
const pages = {
 'dealer-americas':'https://www.chevroletamericas.com.br/novos/s10-2027',
 'dealer-granleste':'https://www.granlestegm.com.br/novos/chevrolet-onix',
 's10-config':'https://www.chevrolet.com.br/modelos/monte-o-seu/s10-cabine-dupla',
 'onix-config':'https://www.chevrolet.com.br/modelos/monte-o-seu/onix',
 'dealer-onix':'https://www.artvelchevrolet.com.br/carros/chevrolet-onix',
 'dealer-dahruj':'https://www.dahrujchevrolet.com.br/novos/chevrolet-s10',
 'dealer-s10':'https://cotac.com.br/carros/nova-s10-cabine-simples/',
 'dealer-nova':'https://www.chevroletnova.com.br/novos',
}
await fs.mkdir('data/extracted/final-image-search',{recursive:true})
await Promise.all(Object.entries(pages).map(async ([name,url])=>{
 try {
  const r=await fetch(url,{signal:AbortSignal.timeout(20000)});const html=await r.text();
  await fs.writeFile(`data/extracted/final-image-search/${name}.html`,html)
  const chunks=[...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)].map(m=>JSON.parse(m[1])).join('')
  const id=chunks.match(/"vedoId":"([^"]+)"/)?.[1]
  console.log(name,r.status,'vedo',id)
  if(id){const d=await fetch(`https://vedo.ext.gm.com/app/delivery/v2/experience/${id}`,{signal:AbortSignal.timeout(20000)}).then(r=>r.json());await fs.writeFile(`data/extracted/final-image-search/${name}.json`,JSON.stringify(d));console.log(name,Object.entries(d.configurationData||{}).map(([k,v])=>[k,v.trim.name]))}
  console.log(name,[...new Set(html.match(/[^"<>\s]*(?:activ|chassi|onix-pro)[^"<>\s]*\.(?:jpg|png|webp)/gi)||[])].slice(0,30))
  if(name.startsWith('dealer'))console.log(name,'color assets',[...new Set(html.match(/[^"<>\s]*(?:colorizer|cor-|wt-mt)[^"<>\s]*/gi)||[])].slice(0,15))
 }catch(e){console.log(name,String(e))}
}))
