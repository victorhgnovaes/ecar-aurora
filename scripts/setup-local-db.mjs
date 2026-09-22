import fs from 'node:fs'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
const bin = process.env.POSTGRES_BIN || 'C:/Program Files/PostgreSQL/18/bin'
if (fs.existsSync('.env')) throw new Error('.env existente: preservar e configurar manualmente')
const password = crypto.randomBytes(24).toString('hex')
execFileSync(`${bin}/psql.exe`, ['-h','127.0.0.1','-p','55432','-U','ecar','-d','ecar_aurora','-v','ON_ERROR_STOP=1'], { input: `ALTER ROLE ecar WITH PASSWORD '${password}';`, stdio: ['pipe','pipe','pipe'] })
fs.writeFileSync('.env', `DATABASE_URL=postgresql://ecar:${password}@127.0.0.1:55432/ecar_aurora\nPORT=3001\nPUBLIC_SITE_URL=http://localhost:5173,http://127.0.0.1:5173\nWHATSAPP_NUMBER=\nVITE_API_URL=/api\nPYTHON_EXECUTABLE=C:/Users/vihnd/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe\n`)
fs.writeFileSync('.local/postgres/pg_hba.conf', 'host all all 127.0.0.1/32 scram-sha-256\nhost all all ::1/128 scram-sha-256\n')
execFileSync(`${bin}/pg_ctl.exe`, ['-D','.local/postgres','reload'], {stdio:'pipe'})
console.log('Credenciais locais geradas em .env; autenticação SCRAM habilitada.')
