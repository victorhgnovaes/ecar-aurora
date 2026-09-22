import fs from 'node:fs'
const p = JSON.parse(fs.readFileSync('package.json','utf8'))
Object.assign(p.scripts, {
  'db:up':'docker compose up -d db', 'db:migrate':'prisma migrate deploy', 'db:generate':'prisma generate', 'db:seed':'prisma db seed',
  'catalog:import':'tsx scripts/import-chevrolet-catalog.ts', 'catalog:validate':'tsx scripts/validate-chevrolet-catalog.ts', 'images:sync':'tsx scripts/sync-chevrolet-images.ts',
  'api:build':'tsc -p server/tsconfig.json', 'api:start':'node server/dist/main.js', 'api:dev':'npm run api:build && npm run api:start', 'test:api':'tsx --test tests/catalog-api.test.ts',
})
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')
