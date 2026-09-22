import { writeFile, rename } from 'node:fs/promises'

// Run after importing/reviewing prices and images in the local database.
const base = process.env.CATALOG_EXPORT_API_URL || 'http://127.0.0.1:3001/api'
async function get(path) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Exportação falhou: ${path} (HTTP ${response.status})`)
  return response.json()
}
const summaries = await get('/vehicles')
if (!Array.isArray(summaries) || !summaries.length) throw new Error('Catálogo vazio; exportação cancelada')
const details = await Promise.all(summaries.map(model => get(`/vehicles/${encodeURIComponent(model.slug)}`)))
if (details.some(model => !model.versions?.length)) throw new Error('Catálogo incompleto; exportação cancelada')
const destination = 'data/generated/api-fixtures.json'
await writeFile(`${destination}.tmp`, `${JSON.stringify({ summaries, details }, null, 2)}\n`)
await rename(`${destination}.tmp`, destination)
console.log(`Catálogo atualizado: ${details.length} modelos. Revise e publique um novo deploy.`)
