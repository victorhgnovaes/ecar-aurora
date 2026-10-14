import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'

const expected=JSON.parse(readFileSync('data/generated/api-fixtures.json','utf8'))
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
const github='https://api.github.com/repos/victorhgnovaes/ecar-aurora'
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'ecar-catalog-verification'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return r.json()}
const commit=await get(`${github}/commits/${sha}/status`)
console.log({commit:sha,deployments:commit.statuses.map(s=>({context:s.context,state:s.state,url:s.target_url}))})
const vercel=commit.statuses.find(s=>s.context==='Vercel')
if(!vercel||vercel.state!=='success')throw new Error('Deploy Vercel ainda não concluído com sucesso')
const base=process.argv[2]||'https://ecar-aurora.vercel.app'
const summaries=await get(`${base}/catalog/vehicles.json`)
assert.deepEqual(summaries,expected.summaries,'Catálogo publicado diferente do snapshot exportado')
let checked=0
for(const model of expected.details){
 const actual=await get(`${base}/catalog/vehicles/${model.slug}.json`)
 assert.deepEqual(actual,model,`Catálogo desatualizado: ${model.slug}`)
 checked+=model.versions.length
}
console.log({site:base,models:expected.details.length,versions:checked,productionCatalogMatchesDatabaseExport:true})
