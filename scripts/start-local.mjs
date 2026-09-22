import { spawn } from 'node:child_process'
import net from 'node:net'
const cwd=new URL('..',import.meta.url)
async function listening(port){return new Promise(resolve=>{const socket=net.createConnection({host:'127.0.0.1',port});socket.once('connect',()=>{socket.destroy();resolve(true)});socket.once('error',()=>resolve(false))})}
const children=[]
if(!await listening(3001))children.push(spawn(process.execPath,['server/dist/main.js'],{cwd,stdio:'inherit'}))
else console.log('API já está ativa na porta 3001.')
if(!await listening(5173))children.push(spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{cwd,stdio:'inherit'}))
else console.log('Site já está ativo em http://localhost:5173')
for(const child of children)child.on('error',error=>console.error(error.message))
process.on('SIGINT',()=>{children.forEach(child=>child.kill());process.exit()})
