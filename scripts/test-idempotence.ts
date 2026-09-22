import 'dotenv/config'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { prisma } from '../server/db.js'
async function snapshot(){return Promise.all([prisma.vehicleModel.findMany({select:{id:true},orderBy:{id:'asc'}}),prisma.vehicleVersion.findMany({select:{id:true},orderBy:{id:'asc'}}),prisma.vehicleConfiguration.findMany({select:{id:true},orderBy:{id:'asc'}}),prisma.versionPaintColor.findMany({select:{id:true},orderBy:{id:'asc'}})])}
try {const before=await snapshot();execFileSync(process.execPath,['--import','tsx','scripts/import-chevrolet-catalog.ts'],{stdio:'inherit'});assert.deepEqual(await snapshot(),before);console.log('PASS: reimportação preserva contagens e todos os IDs')}finally{await prisma.$disconnect()}
