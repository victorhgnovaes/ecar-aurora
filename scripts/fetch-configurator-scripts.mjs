import fs from 'node:fs/promises'
const scripts=JSON.parse(await fs.readFile('data/extracted/configurator-scripts.json','utf8'))
const found=[]
for(const url of scripts){
 try {const r=await fetch(new URL(url,'https://www.chevrolet.com.br'),{signal:AbortSignal.timeout(15000)});if(!r.ok)continue;const source=await r.text();if(/urlPatterns|\/vcp|configurationData|\/configurations|\/graphql/.test(source)){const file=url.split('/').pop();await fs.writeFile(`data/extracted/${file}`,source);found.push(file);for(const term of ['urlPatterns','/vcp','configurationData','/configurations','/graphql']){const i=source.indexOf(term);if(i>=0)console.log(file,term,source.slice(Math.max(0,i-200),i+400))}}}catch(e){console.log(String(e))}
}
console.log('image config scripts',found)
