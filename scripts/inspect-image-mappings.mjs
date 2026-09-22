import fs from 'node:fs'
for(const slug of ['onix','spin','montana','s10','spark-euv']){
 const d=JSON.parse(fs.readFileSync(`data/extracted/color-images-${slug}.json`,'utf8'));console.log(slug,d.data.colorizerModelByPath.item.trims[0].exteriors.map(c=>({name:c.name,code:c.rpoId})))
}
for(const slug of ['sonic','onix','s10']){
 const html=fs.readFileSync(`data/extracted/configurator-${slug}.html`,'utf8')
 const chunks=[...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)].map(m=>JSON.parse(m[1])).join('')
 fs.writeFileSync(`data/extracted/configurator-data-${slug}.txt`,chunks)
 console.log(slug,'decoded',chunks.length)
 for(const term of ['urlPatterns','imageUrls','ExteriorColor','endpoint','configurationData','vedo','api/']){const index=chunks.indexOf(term);if(index>=0)console.log(term,chunks.slice(Math.max(0,index-100),index+250))}
}
