import fs from 'node:fs'
const d=JSON.parse(fs.readFileSync('data/extracted/vedo-tracker.json','utf8'))
for(const [key,trim] of Object.entries(d.configurationData)){
 const codes=trim.configuration.facets.filter(f=>f.name==='ExteriorColor').flatMap(f=>f.options)
 console.log(key,trim.configuration.options.filter(o=>codes.includes(o.code)).map(o=>({code:o.code,name:o.name,description:o.description})))
 console.log('patterns',JSON.stringify(trim.configuration.urlPatterns.exterior).slice(-1000))
}
console.log('override',JSON.stringify(d.configurationDataOverrides).slice(0,2400))
const html=fs.readFileSync('data/extracted/configurator-sonic.html','utf8')
const scripts=[...html.matchAll(/src="([^"]+)"/g)].map(m=>m[1]).filter(s=>s.includes('.js'))
console.log('scripts',scripts.slice(-15))
fs.writeFileSync('data/extracted/configurator-scripts.json',JSON.stringify(scripts))
