import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
const source = 'C:/Users/vihnd/Downloads/cor-amarelo-canario-spark.avif'
const localPath = '/assets/vehicles/spark-euv-2026/pea/amarelo-canario/front-3q.png'
const original = await fs.readFile(source)
await fs.mkdir('public/assets/vehicles/spark-euv-2026/pea/amarelo-canario', { recursive: true })
const bytes = await sharp(original).png({ compressionLevel: 9 }).toBuffer()
await fs.writeFile(`public${localPath}`,bytes)
const entry = {model:'spark-euv',version:'pea',color:'amarelo-canario',localPath,sourceUrl:'https://www.artvelchevrolet.com.br/content/dam/chevrolet/sa/br/pt/master/home/electric/spark-euv/colorizer/cor-amarelo-canario.jpg?imwidth=1920',originalFileName:'cor-amarelo-canario-spark.avif',sha256:createHash('sha256').update(bytes).digest('hex'),originalSha256:createHash('sha256').update(original).digest('hex'),userApproved:true,approvedAt:'2026-09-21',approval:'User explicitly supplied this downloaded image and requested its use for Spark Amarelo Canário. Not classified as an image downloaded from Chevrolet Brasil.'}
let entries=[]
try {entries=JSON.parse(await fs.readFile('data/user-image-overrides.json','utf8'))} catch(error){if(error.code!=='ENOENT')throw error}
entries=entries.filter(e=>!(e.model===entry.model&&e.version===entry.version&&e.color===entry.color))
entries.push(entry)
await fs.writeFile('data/user-image-overrides.json',JSON.stringify(entries,null,2))
console.log('PNG salvo:',localPath,await sharp(bytes).metadata())