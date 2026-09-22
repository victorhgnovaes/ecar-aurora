import 'dotenv/config'
import { mkdir, readFile, copyFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { prisma } from '../server/db.js'
const sourceUrl = 'https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/cars/onix/refresh/versions/versiones-v3/desktop/3_activ_turbo_atdesk.png'
const localPath = '/assets/vehicles/onix-2027/r7y/reference.png'
try {
 const approved: {model:string;version:string;color:string|null;userApproved:boolean}[] = JSON.parse(await readFile('data/user-image-overrides.json','utf8'))
 if(approved.some(i=>i.userApproved&&i.model==='onix'&&i.version==='r7y'&&i.color===null)) {
  console.log('Referência fornecida pelo usuário preservada. Use images:sync para sincronizá-la.')
 } else {
 const version = await prisma.vehicleVersion.findFirstOrThrow({ where: { slug: 'r7y', active: true, model: { slug: 'onix', modelYear: 2027 } } })
 await mkdir('public/assets/vehicles/onix-2027/r7y', { recursive: true })
 try { await readFile('data/extracted/activ-official.png') } catch {
  const response = await fetch(sourceUrl, { redirect: 'error', signal: AbortSignal.timeout(30000) })
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Imagem oficial indisponível')
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 25000000) throw new Error('Imagem excede o limite')
  await mkdir('data/extracted', { recursive: true })
  await writeFile('data/extracted/activ-official.png', bytes)
 }
 await copyFile('data/extracted/activ-official.png', `public${localPath}`)
 const bytes = await readFile(`public${localPath}`)
 const meta = await sharp(bytes).metadata()
 const data = { vehicleModelId: version.vehicleModelId, vehicleVersionId: version.id, localPath, originalSourceUrl: sourceUrl, sourceDomain: 'www.chevrolet.com.br', mimeType: 'image/png', width: meta.width, height: meta.height, sha256: createHash('sha256').update(bytes).digest('hex'), status: 'READY', viewName: 'reference' }
 await prisma.vehicleImage.upsert({ where: { assetKey: 'onix:r7y:reference' }, create: { assetKey: 'onix:r7y:reference', ...data }, update: data })
 await writeFile('data/reports/version-reference-images.json', JSON.stringify({ sourcePage: 'https://www.chevrolet.com.br/carros/novo-onix', ...data, colorAssociation: null, reason: 'Official version photo; no exact paint association inferred from appearance.' }, null, 2))
 console.log('Referência oficial do Onix Activ instalada; nenhuma cor artificialmente atribuída.')
 }
} finally { await prisma.$disconnect() }
