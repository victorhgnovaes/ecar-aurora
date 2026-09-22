import fs from 'node:fs'
const file='src/pages/HomePage/HomePage.tsx'
let text=fs.readFileSync(file,'utf8')
text=text.replace('CarFront, Palette, MessageCircle, ChevronRight, ChevronDown','ChevronRight, ChevronDown')
text=text.replace("import { Hero }", "import { HowItWorks } from '../../components/vehicles/HowItWorks'\nimport { Hero }")
const start=text.indexOf('<div className={s.steps}>')
const end=text.indexOf('</div></div></section><section id="duvidas"',start)
if(start<0||end<0)throw new Error('Seção não encontrada')
text=text.slice(0,start)+'<HowItWorks />'+text.slice(end+6)
fs.writeFileSync(file,text)
