import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const root=path.resolve(import.meta.dirname,'..')
const directory=path.join(root,'.local','postgres')
const executable=path.join(process.env.POSTGRES_BIN || 'C:/Program Files/PostgreSQL/18/bin','pg_ctl.exe')
if(!fs.existsSync(path.join(directory,'PG_VERSION')))throw new Error('Cluster local ausente. Configure PostgreSQL ou execute npm run db:up com Docker.')
try{execFileSync(executable,['-D',directory,'status'],{stdio:'ignore'});console.log('PostgreSQL local já está ativo.')}catch{execFileSync(executable,['-D',directory,'-l',path.join(root,'.local','postgres.log'),'-o','-p 55432 -h 127.0.0.1','start'],{stdio:'inherit'})}
