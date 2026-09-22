import fs from 'node:fs/promises'
const js=await fetch('https://www.chevrolet.com.br/etc.clientlibs/clientlibs/solar/gbds/quantum_360_colorizer.lc-90f898b4014c78128a74cac4942aa221-lc.min.js').then(r=>r.text())
for(const term of ['framenumber','padStart']) {const i=js.indexOf(term);console.log(term,js.slice(Math.max(0,i-350),i+450))}
for(const route of ['/app/delivery/v2/experience/','/app/delivery/experience/']) {
 const url='https://vedo.ext.gm.com'+route+'fdb200c0-3bc0-4ec0-b549-0c3145d76b86'
 try {const r=await fetch(url,{signal:AbortSignal.timeout(20000)});console.log(url,r.status);if(r.ok)await fs.writeFile('data/extracted/vedo-tracker.json',await r.text())}catch(e){console.log(String(e))}
}
