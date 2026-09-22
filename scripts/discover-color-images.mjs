import fs from 'node:fs/promises'
for (const slug of ['onix','onix-plus','spark-euv','captiva-ev']) {
  const html=await fs.readFile(`data/extracted/image-page-${slug}.html`,'utf8')
  const endpoint=html.match(/data-trims-json-endpoint="([^"]+)"/)?.[1]
  if(!endpoint)continue
  const url=new URL(endpoint.replaceAll('&amp;','&'),'https://www.chevrolet.com.br').href
  try { const response=await fetch(url,{signal:AbortSignal.timeout(30000)}); if(!response.ok)throw new Error(String(response.status)); const body=await response.text(); await fs.writeFile(`data/extracted/color-images-${slug}.json`,body);console.log(slug,body.slice(0,1800)) }catch(error){console.log(slug,String(error))}
}
