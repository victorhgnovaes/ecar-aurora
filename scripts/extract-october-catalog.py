import json, pathlib, hashlib, os
import pdfplumber, pypdfium2 as pdfium
from PIL import Image, ImageDraw

root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(os.environ['PUBLIC_PRICES_PDF']) if 'PUBLIC_PRICES_PDF' in os.environ else next((root/'data/sources/monthly').glob('LISTA DE PRE*OUTUBRO*'))
out=root/'tmp/pdfs/october'
out.mkdir(parents=True,exist_ok=True)
render=pdfium.PdfDocument(str(source))
result=[]
with pdfplumber.open(source) as pdf:
 for i,p in enumerate(pdf.pages):
  text=p.extract_text(layout=True)
  tables=[{'bbox':t.bbox,'rows':t.extract(x_tolerance=1)} for t in p.find_tables()]
  result.append({'page':i+1,'tables':tables,'text':text})
  image=render[i].render(scale=1500/render[i].get_width()).to_pil().convert('RGB')
  image.save(out/f'page-{i+1:02}.png')
  print(i+1, next((line.strip() for line in text.splitlines() if line.strip()),''),flush=True)
(out/'tables.json').write_text(json.dumps({'source':{'fileName':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pageCount':len(result)},'pages':result},ensure_ascii=False,indent=2),encoding='utf-8')
for offset in range(0,len(result),4):
 sheet=Image.new('RGB',(1800,1400),'#ddd')
 for index,item in enumerate(result[offset:offset+4]):
  image=Image.open(out/f'page-{item["page"]:02}.png');image.thumbnail((900,660))
  x=index%2*900;y=index//2*700
  sheet.paste(image,(x,y+30));ImageDraw.Draw(sheet).text((x+15,y+7),f'PAGE {item["page"]}',fill='black')
 sheet.save(out/f'review-{offset//4+1:02}.jpg')
print('Complete:',len(result),'pages',flush=True)
