import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const database = new URL(process.env.DATABASE_URL)
const executable = process.env.PG_DUMP_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe' : 'pg_dump')
mkdirSync('.local/deploy', { recursive: true })
execFileSync(executable, ['--host', database.hostname, '--port', database.port || '5432', '--username', decodeURIComponent(database.username), '--dbname', database.pathname.slice(1), '--format=custom', '--data-only', '--exclude-table=public._prisma_migrations', '--no-owner', '--no-acl', '--file', '.local/deploy/catalog.dump'], { env: { ...process.env, PGPASSWORD: decodeURIComponent(database.password) }, stdio: ['ignore', 'ignore', 'pipe'] })
console.log('Backup privado criado: .local/deploy/catalog.dump. Envie por SSH; nunca copie para public ou dist.')
