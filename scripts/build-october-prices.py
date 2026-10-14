"""Match the new public PDF to the existing catalog by full factory codes and MY."""
import json,re,pathlib,datetime,unicodedata
from decimal import Decimal

root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'tmp/pdfs/october/tables.json').read_text(encoding='utf-8'))
catalog=json.loads((root/'data/generated/chevrolet-catalog.json').read_text(encoding='utf-8'))
flat=lambda s:re.sub(r'\s+',' ',s or '').strip()
slug=lambda s:re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
money=lambda s:format(Decimal(s.replace('.','').replace(',','.')),'.2f')
months={'janeiro':1,'fevereiro':2,'março':3,'abril':4,'maio':5,'junho':6,'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12}
records=[]
for page in data['pages']:
 text=page['text']
 year=re.search(r'Ano[ -]Modelo\s+(\d{4})',text,re.I)
 if not year:continue
 previous=None
 for table in page['tables']:
  for row in table['rows']:
   index=next((i for i,c in enumerate(row[:5]) if c and re.fullmatch(r'[1-9A-Z0-9\s/\-]+',c) and re.search(r'\b[1-9][A-Z0-9]{5}\b',c)),None)
   if index is None or len(row)<=index+3:continue
   models=re.findall(r'\b[1-9][A-Z0-9]{5}\b',row[index])
   codes=re.findall(r'\b[A-Z][A-Z0-9]{2}\b',row[index+1] or '')
   if not codes:continue
   name=flat(row[index-1]) or previous
   previous=name
   prices=re.findall(r'(?<!\d)\d{1,3}(?:\.\d{3})+(?:,\d{2})?(?!\d)',row[index+3] or '')
   assert len(prices)==1,('Preço nacional não unívoco',page['page'],row[index+3])
   for i,model in enumerate(models):
    records.append({'modelYear':int(year[1]),'modelCode':model,'optionalCode':codes[min(i,len(codes)-1)],'name':name,'content':row[index+2],'national':money(prices[0]),'zfm':money(row[index+4]) if len(row)>index+4 and re.fullmatch(r'[\d.,]+',row[index+4] or '') else None,'page':page['page'],'text':text})

changes=[];used=set()
for model in catalog['models']:
 for version in model['versions']:
  matches=[]
  for configuration in version['configurations']:
   found=[r for r in records if r['modelYear']==model['modelYear'] and r['modelCode']==configuration['modelCode'] and r['optionalCode']==configuration['optionalCode']]
   assert len(found)==1,('Correspondência não unívoca',model['name'],model['modelYear'],configuration,len(found))
   matches.append(found[0]);used.add((found[0]['modelYear'],found[0]['modelCode'],found[0]['optionalCode']))
   configuration['sourcePage']=found[0]['page'];configuration['rawContent']=found[0]['content']
  assert len({(r['national'],r['zfm']) for r in matches})==1,('Preços de configurações agrupadas divergem',model['slug'],version['slug'])
  row=matches[0];text=row['text'];old=version['publicPriceNational']
  version['publicPriceNational']=row['national'];version['publicPriceZfm']=row['zfm'];version['sourcePage']=row['page']
  version['rawContent']=row['content']
  dm=re.search(r'VIGÊNCIA:\s*(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})',text,re.I)
  assert dm,('Data não extraída',row['page'])
  version['effectiveDate']=datetime.date(int(dm[3]),months[dm[2].lower()],int(dm[1])).isoformat()
  lm=re.search(r'LISTA\s*N[°ºo]\s*([^\n]+)',text,re.I)
  assert lm
  version['listNumber']=re.split(r'\s{3,}',lm[1].strip())[0]
  colors=[]
  for line in text.split('Pintura:')[-1].split('\n'):
   cm=re.match(r'^\s*(.+?)\s{3,}([\d.,]+)(?:\s+([\d.,]+))?(?:\s+[\d.,]+)*\s*$',line)
   if not cm:continue
   original=cm[1].strip();restriction=re.search(r'\(somente (.*?)\)',original,re.I)
   options=sorted(set(c['optionalCode'] for c in version['configurations']))
   if restriction:
    allowed=[code for code in options if code in restriction[1]]
    if not allowed:
     if restriction[1].lower() not in version['name'].lower():continue
     allowed=options
   else:allowed=options
   name=re.sub(r'\s*\(somente .*?\)','',original,flags=re.I).strip()
   colors.append({'name':name,'slug':slug(name),'paintType':None,'additionalPriceNational':money(cm[2]),'additionalPriceZfm':money(cm[3]) if cm[3] else None,'sourcePage':row['page'],'allowedOptionalCodes':allowed,'sourceText':line.strip()})
  assert colors,('Pinturas não extraídas',row['page'])
  assert len({c['slug'] for c in colors})==len(colors)
  version['colors']=colors
  version['fieldEvidence']={**version['fieldEvidence'],'publicPriceSource':'LISTA DE PREÇOS PÚBLICOS 02 OUTUBRO 2026','publicPricePage':str(row['page']),'pdfTitle':next(line.strip() for line in text.splitlines() if line.strip())}
  version['matchingRule']='EXACT existing modelYear + full PDF modelCode + configurationCode; all grouped configurations have the same national/ZFM prices; source page and individual paint values checked'
  version['observations']='\n'.join(line.strip() for line in text.splitlines() if line.strip().startswith(('*','A General Motors')))
  changes.append({'model':model['name'],'modelYear':model['modelYear'],'version':version['displayName'],'page':row['page'],'previousPrice':old,'publicPrice':row['national'],'changed':old!=row['national']})

catalog['source']=data['source']
(root/'data/generated/october-prices.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'data/reports/october-price-match.json').write_text(json.dumps({'matched':len(changes),'changedPrices':sum(r['changed'] for r in changes),'records':changes,'differentVehicles':[{'modelYear':r['modelYear'],'modelCode':r['modelCode'],'optionalCode':r['optionalCode'],'version':r['name'],'page':r['page'],'publicPrice':r['national']} for r in records if (r['modelYear'],r['modelCode'],r['optionalCode']) not in used]},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'matched':len(changes),'changedPrices':sum(r['changed'] for r in changes),'pdfConfigurations':len(records),'differentVehicles':len(records)-len(used)},ensure_ascii=True))
