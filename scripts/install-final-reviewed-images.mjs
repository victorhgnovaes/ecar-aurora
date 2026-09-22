import fs from 'node:fs/promises'
import sharp from 'sharp'

// Only reviewed version/paint matches. Do not recolor or substitute another trim.
const sources=JSON.parse(await fs.readFile('data/extracted/final-image-search/candidates.json','utf8'))
const items=[
 {model:'onix',version:'a3x',color:'prata-shark',name:'onix-pro',sourcePage:'https://www.artvelchevrolet.com.br/carros/chevrolet-onix',rule:'Official Chevrolet dealer 2027 Onix Pro section; visual review confirms silver paint and Pro 16-inch alloy wheels. Prata Shark is the only silver paint listed for A3X in the source catalog.'},
 {model:'s10',version:'r7f',color:'preto-ouro-negro',name:'s10-wt-mt',sourcePage:'https://www.chevrolet.com.br/picapes/s10',rule:'Chevrolet 2027 page explicitly labels this asset S10 WT MT. Visual review confirms black paint and steel wheels matching R7F; Preto Ouro Negro is the only black paint in its source catalog.'},
]
const reviewed=JSON.parse(await fs.readFile('data/reviewed-image-manifest.json','utf8'))
const manifest=JSON.parse(await fs.readFile('data/image-manifest.json','utf8'))
for(const {name,...item} of items){
 const entry={...item,url:sources.find(s=>s.name===name).url,viewName:'front-3q'}
 const directory=`public/assets/vehicles/${item.model}-2027/${item.version}/${item.color}`
 await fs.mkdir(directory,{recursive:true})
 await sharp(`data/extracted/final-image-search/${name}.image`).resize({width:1400,withoutEnlargement:true}).png({compressionLevel:9}).toFile(`${directory}/front-3q.png`)
 for(const list of [reviewed,manifest]){const index=list.findIndex(i=>i.model===item.model&&i.version===item.version&&i.color===item.color);if(index<0)list.push(entry);else list[index]=entry}
 console.log(`${item.model}/${item.version}/${item.color}: installed`)
}
await fs.writeFile('data/reviewed-image-manifest.json',JSON.stringify(reviewed,null,2))
await fs.writeFile('data/image-manifest.json',JSON.stringify(manifest,null,2))
