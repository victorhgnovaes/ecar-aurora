import assert from 'node:assert/strict'
const base='http://127.0.0.1:3001/api'
const checks:[string,number][]=[['/vehicles',200],['/vehicles?category=Picape',200],['/vehicles?category=invalid',400],['/vehicles?year=abc',400],['/vehicles?minPrice=200&maxPrice=100',400],['/vehicles?search=%27%3BDROP',400],['/vehicles?unknown=1',400],['/versions/not-a-uuid',400],['/vehicles/inexistente',404],['/catalog/meta',200]]
for(const [path,status] of checks){const response=await fetch(base+path);assert.equal(response.status,status,path)}
const models=await fetch(base+'/vehicles').then(r=>r.json());assert.equal(models.length,9)
for(const model of models){const detail=await fetch(`${base}/vehicles/${model.slug}`).then(r=>r.json());assert(detail.versions.length>0);const version=detail.versions[0];for(const path of [`/vehicles/${model.slug}/versions`,`/versions/${version.id}`,`/versions/${version.id}/colors`,`/versions/${version.id}/specifications`])assert.equal((await fetch(base+path)).status,200)}
const disallowed=await fetch(base+'/vehicles',{headers:{Origin:'https://untrusted.example'}});assert.equal(disallowed.headers.get('access-control-allow-origin'),null)
const allowed=await fetch(base+'/vehicles',{headers:{Origin:'http://localhost:5173'}});assert.equal(allowed.headers.get('access-control-allow-origin'),'http://localhost:5173')
assert.equal((await fetch(base+'/vehicles',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,404)
console.log('PASS: rotas de leitura, filtros, parâmetros inválidos, CORS e ausência de escrita pública')
