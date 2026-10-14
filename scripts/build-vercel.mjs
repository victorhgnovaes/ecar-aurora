import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { dirname } from 'node:path'
import { calculatePrice, resolveCondition } from '#conditions'

// This is a versioned snapshot of the real catalog API, also used by UI tests.
// No local database or credentials are needed during a Vercel build.
const snapshot = JSON.parse(await readFile('data/generated/api-fixtures.json', 'utf8'))
if (!snapshot.details?.length || snapshot.details.length !== snapshot.summaries?.length) {
  throw new Error('Catálogo incompleto: atualize data/generated/api-fixtures.json antes do deploy.')
}
const documents = new Map()
const summaries = []
let versionCount = 0
for (const model of snapshot.details) {
  if (!/^[a-z0-9-]+$/.test(model.slug) || !model.versions?.length) throw new Error('Modelo inválido no catálogo')
  const { versions, ...summary } = model
  summaries.push(summary)
  documents.set(`vehicles/${model.slug}`, model)
  documents.set(`vehicles/${model.slug}/versions`, versions)
  const images = [model.image]
  for (const version of versions) {
    if (!/^[a-f0-9-]+$/i.test(version.id) || !version.colors?.length) throw new Error('Versão inválida no catálogo')
    versionCount++
    const rate = resolveCondition(version.discount)
    for (const color of version.colors) {
      const expected = rate === null ? null : calculatePrice(color.finalPrice,rate)
      if (color.corporatePrice !== (expected?.corporatePrice ?? null) || color.discountAmount !== (expected?.discountAmount ?? null)) throw new Error(`Preço corporativo inconsistente: ${model.slug}/${version.slug}/${color.slug}; exporte novamente a API.`)
    }
    documents.set(`versions/${version.id}`, version)
    documents.set(`versions/${version.id}/colors`, version.colors)
    const { technical, rawContent, features, source } = version
    documents.set(`versions/${version.id}/specifications`, { technical, rawContent, features, source })
    images.push(...version.colors.map(color => color.image))
  }
  for (const image of new Set(images)) {
    if (!image?.startsWith('/assets/') || image.includes('..')) throw new Error(`Imagem inválida: ${image}`)
    await access(`public${image}`)
  }
}
documents.set('vehicles', summaries)
documents.set('catalog/meta', { models: summaries.length, versions: versionCount, region: 'NATIONAL', whatsappNumber: null })

const env = { ...process.env, VITE_CATALOG_MODE: 'static' }
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-b'], { stdio: 'inherit', env })
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'inherit', env })
for (const [route, data] of documents) {
  const destination = `dist/catalog/${route}.json`
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, JSON.stringify(data))
}
console.log(`Catálogo Vercel: ${summaries.length} modelos, ${versionCount} versões; sem dependência de localhost.`)
