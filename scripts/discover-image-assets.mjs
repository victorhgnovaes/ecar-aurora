import fs from 'node:fs/promises'
const pages = {onix:'carros/novo-onix','onix-plus':'carros/novo-onix-plus',sonic:'suvs/sonic',spin:'suvs/nova-spin',tracker:'suvs/novo-tracker',montana:'picapes/nova-montana',s10:'picapes/s10','spark-euv':'eletrico/spark-euv','captiva-ev':'eletrico/captiva-ev'}
const results=[]
for(const [slug,path] of Object.entries(pages)) {
  try {
    const pageUrl='https://www.chevrolet.com.br/'+path
    const res=await fetch(pageUrl,{signal:AbortSignal.timeout(30000)})
    if(!res.ok) throw new Error(String(res.status))
    const html=await res.text()
    await fs.writeFile(`data/extracted/image-page-${slug}.html`,html)
    // Read image references only. No prices, equipment or automotive specifications enter the catalog.
    const urls=[...new Set(html.match(/(?:https:\/\/[^"'<>\s]+)?\/content\/dam\/[^"'<>\s]+?\.(?:png|webp|jpe?g)/g)||[])]
    const images=urls.filter(u=>!u.includes('global-footer')&&!u.includes('portable-navigation')&&!u.includes('icon'))
    results.push({slug,pageUrl,images})
    console.log(slug,images.filter(u=>/cor|color|branco|azul|prata|preto|vermelho|cinza|jelly/i.test(u)))
  } catch(e){results.push({slug,error:String(e)});console.log(slug,String(e))}
}
await fs.writeFile('data/extracted/image-discovery.json',JSON.stringify(results,null,2))
