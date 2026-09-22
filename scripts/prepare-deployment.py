from pathlib import Path
files={
'deploy/Dockerfile': '''FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate
COPY server ./server
COPY src ./src
COPY public ./public
COPY index.html tsconfig*.json vite.config.ts ./
ARG VITE_WHATSAPP_NUMBER=5511989266321
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER VITE_API_URL=/api
RUN npm run api:build && npm run build
FROM base AS api
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts /app/package.json ./
USER node
CMD ["node", "server/dist/main.js"]
FROM caddy:2-alpine AS web
COPY --from=build /app/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
''',
'deploy/Caddyfile': '''{$SITE_DOMAIN} {
 encode zstd gzip
 header X-Content-Type-Options nosniff
 header Referrer-Policy strict-origin-when-cross-origin
 handle /api/* {
  reverse_proxy api:3001
 }
 handle /assets/* {
  root * /srv
  file_server
 }
 handle {
  root * /srv
  try_files {path} /index.html
  file_server
 }
}
''',
'compose.production.yml': '''services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_USER: ecar
      POSTGRES_DB: ecar_aurora
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Defina POSTGRES_PASSWORD}
    volumes:
      - production_db:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecar -d ecar_aurora"]
      interval: 5s
      timeout: 5s
      retries: 20
  api:
    build:
      context: .
      dockerfile: deploy/Dockerfile
      target: api
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://ecar:${POSTGRES_PASSWORD:?Defina POSTGRES_PASSWORD}@db:5432/ecar_aurora
      NODE_ENV: production
      PORT: 3001
      HOST: 0.0.0.0
      TRUST_PROXY: "1"
      PUBLIC_SITE_URL: https://${SITE_DOMAIN:?Defina SITE_DOMAIN}
      WHATSAPP_NUMBER: ${WHATSAPP_NUMBER:-5511989266321}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3001/api/catalog/meta').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
  web:
    build:
      context: .
      dockerfile: deploy/Dockerfile
      target: web
      args:
        VITE_WHATSAPP_NUMBER: ${WHATSAPP_NUMBER:-5511989266321}
    restart: unless-stopped
    environment:
      SITE_DOMAIN: ${SITE_DOMAIN:?Defina SITE_DOMAIN}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      api:
        condition: service_healthy
volumes:
  production_db:
  caddy_data:
  caddy_config:
''',
'.dockerignore': '''node_modules
.git
.env
.env.*
.local
data
references
dist
server/dist
test-results
playwright-report
*.log
''',
'.env.production.example': '''SITE_DOMAIN=aurora.seudominio.com.br
# Gere uma senha hexadecimal: openssl rand -hex 24
POSTGRES_PASSWORD=
WHATSAPP_NUMBER=5511989266321
''',
'scripts/export-deploy-database.mjs': '''import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const database = new URL(process.env.DATABASE_URL)
const executable = process.env.PG_DUMP_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe' : 'pg_dump')
mkdirSync('.local/deploy', { recursive: true })
execFileSync(executable, ['--host', database.hostname, '--port', database.port || '5432', '--username', decodeURIComponent(database.username), '--dbname', database.pathname.slice(1), '--format=custom', '--data-only', '--exclude-table=public._prisma_migrations', '--no-owner', '--no-acl', '--file', '.local/deploy/catalog.dump'], { env: { ...process.env, PGPASSWORD: decodeURIComponent(database.password) }, stdio: ['ignore', 'ignore', 'pipe'] })
console.log('Backup privado criado: .local/deploy/catalog.dump. Envie por SSH; nunca copie para public ou dist.')
'''
}
for name,content in files.items():
 p=Path(name);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content,encoding='utf-8')
p=Path('server/main.ts');s=p.read_text(encoding='utf-8').replace('app.use(helmet())',"if (process.env.TRUST_PROXY === '1') app.getHttpAdapter().getInstance().set('trust proxy', 1)\napp.use(helmet())").replace("'127.0.0.1')","process.env.HOST || '127.0.0.1')");p.write_text(s,encoding='utf-8')
p=Path('.gitignore');s=p.read_text(encoding='utf-8');p.write_text(s+'\n.env.production\n',encoding='utf-8')