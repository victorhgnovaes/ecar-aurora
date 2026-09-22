import fs from 'node:fs/promises'
const audit=JSON.parse(await fs.readFile('data/reports/site-audit.json','utf8'))
const fixtures=JSON.parse(await fs.readFile('data/generated/api-fixtures.json','utf8'))
const references=fixtures.details.flatMap(m=>m.versions.flatMap(v=>v.colors.filter(c=>c.imageStatus==='MISSING').map(c=>({model:m.slug,version:v.slug,color:c.name,image:c.image}))))
if(references.length!==9||references.some(r=>!r.image.endsWith(`/${r.version}/reference.png`)))throw Error('Associação de referência incompleta')
for(const item of references)await fs.access(`public${item.image}`)
const status={exactImages:audit.images.ready,colorsUsingVersionReference:references.length,uncoveredColors:0,references}
await fs.writeFile('data/reports/user-image-coverage.json',JSON.stringify(status,null,2))
const note='\n## Imagens fornecidas pelo usuário — 22/09/2026\n\n19 arquivos de Downloads incorporados e vinculados pelos nomes de versão e cor. Onix LOG A5F (incluindo `pratashark.png`), Onix PRO A3X e S10 WT manual R7F têm imagens para todas as cores. Onix Activ R7Y e S10 Chassis Cab R9D usam suas fotos prata como referência nas outras cores, conforme solicitado. São 211 associações com foto da cor e 9 com referência da própria versão; nenhuma seleção fica sem imagem. O aviso informa que a foto da cor não está disponível e orienta consultar a Ecar sobre a disponibilidade. Originais, nomes e checksums preservados no manifesto `data/user-image-overrides.json`; origem web não informada pelo usuário. Nenhuma recoloração realizada. Cobertura em `data/reports/user-image-coverage.json`.\n'
for(const file of ['ASSET_SOURCES.md','AUDITORIA.md','RELATORIO_ENTREGA.md'])await fs.appendFile(file,note)
let readme=await fs.readFile('README.md','utf8')
readme=readme.replace('24 combinações de imagem ainda pendentes','9 cores usam a foto de referência da própria versão, com aviso para consultar a Ecar')
await fs.writeFile('README.md',readme)
console.log(status)
