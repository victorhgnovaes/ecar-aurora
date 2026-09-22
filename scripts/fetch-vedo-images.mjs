import fs from 'node:fs/promises'
for(const slug of ['sonic','onix','onix-plus','spin','montana','spark-euv']){
 const html=await fs.readFile(`data/extracted/configurator-${slug}.html`,'utf8')
 const chunks=[...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)].map(m=>JSON.parse(m[1])).join('')
 await fs.writeFile(`data/extracted/configurator-data-${slug}.txt`,chunks)
 const id=chunks.match(/"vedoId":"([^"]+)"/)?.[1]
 console.log(slug,'project',id)
 if(!id)continue
 try {const response=await fetch(`https://vedo.ext.gm.com/app/delivery/v2/experience/${id}`,{signal:AbortSignal.timeout(30000)});if(!response.ok){console.log(response.status);continue}const data=await response.json();await fs.writeFile(`data/extracted/vedo-${slug}.json`,JSON.stringify(data));console.log('image trim keys',Object.keys(data.configurationData||{}))}catch(error){console.log(String(error))}
 for(const term of ['Branco Summit','Azul Boreal','Preto Ouro Negro']){const index=chunks.indexOf(term);if(index>=0)console.log('paint-label',chunks.slice(index-200,index+100))}
}
