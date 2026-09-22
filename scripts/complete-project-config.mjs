import fs from 'node:fs'
const file='package.json';const p=JSON.parse(fs.readFileSync(file,'utf8'))
Object.assign(p.scripts,{'test:idempotence':'tsx scripts/test-idempotence.ts','test:e2e':'playwright test','test:all':'npm run test:api && npm test && npm run test:idempotence','images:manifest':'node scripts/prepare-image-assets.mjs && node scripts/append-vedo-images.mjs','lint':'oxlint src server scripts tests e2e *.config.ts','start':'node scripts/start-local.mjs','db:local:start':'node scripts/start-local-db.mjs'})
fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n')
