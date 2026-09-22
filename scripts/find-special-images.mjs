import fs from 'node:fs/promises'
const pages={spark:'https://news.chevrolet.com.br/newsroom.detail.html/Pages/news/br/pt/2025/sep/0908-Chevrolet-Spark-EUV-estreia-como-primeiro-SUV-eletrico-acessivel-inteligente-Brasil.html',activ:'https://news.chevrolet.com.br/newsroom.detail.html/Pages/news/br/pt/2026/jun/0603-onix-2027.html',onix:'https://www.chevrolet.com.br/carros/novo-onix'}
for(const [slug,url] of Object.entries(pages))try{
 const response=await fetch(url,{signal:AbortSignal.timeout(25000)});const html=await response.text();await fs.writeFile(`data/extracted/special-${slug}.html`,html)
 const images=[...new Set(html.match(/(?:https?:)?[^\s"'<>]*\.(?:png|jpg|webp|jpeg)[^\s"'<>]*/gi)||[])].filter(s=>/spark|activ|onix/i.test(s))
 console.log(slug,images.slice(0,35));console.log('related',html.match(/(?:href|data-trims-json-endpoint)="[^"]*(?:activ|spark|colorizer)[^"]*"/g)?.slice(-15))
}catch(e){console.log(String(e))}
