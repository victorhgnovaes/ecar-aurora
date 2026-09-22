import fs from 'node:fs/promises'
const file='src/components/vehicles/Hero.tsx'
let text=await fs.readFile(file,'utf8')
text=text.replace('exclusivas<br />',"exclusivas{' '}<br />").replace('próximo<br />',"próximo{' '}<br />")
text=text.replace("import { WhatsAppIcon } from '../ui/WhatsAppIcon'\n",'').replace(/\{!landing && <div className=\{s\.service\}>[\s\S]*?<\/div>\}/,'')
await fs.writeFile(file,text)
const cssFile='src/components/vehicles/Hero.module.css'
const css=await fs.readFile(cssFile,'utf8')
await fs.writeFile(cssFile,css.replace(/\.service(?: svg)?\{[^}]*\}/g,''))
