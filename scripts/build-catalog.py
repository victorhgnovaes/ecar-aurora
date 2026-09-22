import pathlib,json,re,hashlib,datetime
from decimal import Decimal
root=pathlib.Path(__file__).resolve().parents[1]
read=lambda p:json.loads((root/p).read_text(encoding='utf-8'))
whitelist=read('data/whitelist.json'); manifest=read('data/extracted/source-manifest.json')
pages={p['page']:p for p in read('data/extracted/pdf-tables.json')}
layouts={p['page']:p['text'] for p in read('data/extracted/pdf-pages.json')}
excel=read('data/extracted/excel-selection.json')
review=read('data/source-review.json')
if review['sha256'] != manifest['pdf']['sha256']: raise RuntimeError('PDF alterado: nova revisão visual obrigatória antes da publicação.')
months={'janeiro':1,'fevereiro':2,'março':3,'abril':4,'maio':5,'junho':6,'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12}
money=lambda v:format(Decimal(v.replace('.','').replace(',','.')),'.2f')
flat=lambda s:re.sub(r'\s+',' ',s or '').strip()
slug=lambda s:__import__('unicodedata').normalize('NFKD',s).encode('ascii','ignore').decode().lower().replace(' ','-')
errors=[]; ambiguous=[]; models=[]
for model in whitelist:
    versions=[]
    for order,(optional,page_no) in enumerate(model['versions']):
        p=pages[page_no]; layout=layouts[page_no]; options=optional.split('/')
        try:
            assert page_no in review['pages']
            title=next(t.strip() for t in layout.split('\n') if t.strip())
            assert model['name'].lower() in title.lower()
            assert re.search(r'Ano[ -]Modelo\s+'+str(model['year']),layout,re.I)
            family_token=model['name'].upper().replace(' EV','')
            selected=[r for r in excel if any(family_token in c['text'].upper() for c in r['cells']) and any(c['text'].replace(' ','')==optional for c in r['cells'])]
            assert len(selected)==1, f'Seleção Excel não unívoca: {len(selected)}'
            rows=[]
            for table in p['tables']:
                previous_name=None
                for row in table['rows']:
                    idx=next((i for i,c in enumerate(row[:4]) if c and re.fullmatch(r'[1-9A-Z0-9\s/\-]+',c) and re.search(r'\b[1-9][A-Z0-9]{5}\b',c)),None)
                    if idx is None: continue
                    name=flat(row[idx-1]) or previous_name
                    if name: previous_name=name
                    codes=re.findall(r'\b[A-Z][A-Z0-9]{2}\b',row[idx+1] or '')
                    if not codes or not set(codes).issubset(options): continue
                    content=row[idx+2]
                    models_codes=re.findall(r'\b[1-9][A-Z0-9]{5}\b',row[idx])
                    assert len(codes)==1 or len(codes)==len(models_codes)
                    configs=[{'modelCode':code,'configurationCode':codes[min(i,len(codes)-1)],'optionalCode':codes[min(i,len(codes)-1)],'sourcePage':page_no,'rawContent':content} for i,code in enumerate(models_codes)]
                    rows.append({'name':name,'content':content,'configs':configs,'national':money(row[idx+3]),'zfm':money(row[idx+4])})
            assert rows, 'Não encontrado na página aprovada'
            # Multiple model codes are preserved, not silently chosen. Commercial fields must match exactly.
            identities={(r['name'],re.sub(r'\s+','',r['content']),r['national'],r['zfm']) for r in rows}
            if len(identities)>1:
                ambiguous.append({'family':model['slug'],'optional':optional,'page':page_no,'reason':'Conteúdos/preços divergentes para mesma versão'});continue
            row=rows[0]; configs=[c for r in rows for c in r['configs']]
            assert set(c['optionalCode'] for c in configs)==set(options)
            lm=re.search(r'LISTA\s*N[°ºo]\s*([^\n]+)',layout,re.I)
            list_no=re.split(r'\s{3,}',lm.group(1).strip())[0]
            dm=re.search(r'VIGÊNCIA:\s*(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})',layout,re.I)
            effective=datetime.date(int(dm[3]),months[dm[2].lower()],int(dm[1])).isoformat()
            colors=[]
            for line in layout.split('Pintura:')[-1].split('\n'):
                cm=re.match(r'^\s*(.+?)\s{3,}([\d.,]+)\s+([\d.,]+)(?:\s+[\d.,]+)*\s*$',line)
                if not cm:continue
                original=cm[1].strip(); condition=re.search(r'\(somente (.*?)\)',original,re.I)
                allowed=options[:]
                if condition:
                    restriction=condition[1]
                    if restriction=='LTZ' and row['name']!='LTZ':continue
                    if restriction!='LTZ':
                        allowed=[c for c in options if c in restriction]
                        if not allowed:raise RuntimeError('Restrição de pintura não resolvida: '+original)
                name=re.sub(r'\s*\(somente .*?\)','',original,flags=re.I).strip()
                colors.append({'name':name,'slug':slug(name),'paintType':None,'additionalPriceNational':money(cm[2]),'additionalPriceZfm':money(cm[3]),'sourcePage':page_no,'allowedOptionalCodes':allowed,'sourceText':line.strip()})
            assert colors,'Sem cores'
            assert len({c['slug'] for c in colors})==len(colors)
            content=row['content']; compact=flat(content)
            transmission=re.search(r'Transmiss[ãa]o\s*(?:autom[áa]tica|manual)[^/;]*',compact,re.I)
            if not transmission: transmission=re.search(r'(?:C[âa]mbio|Transmiss[ãa]o)[^/;]*(?:autom[áa]tic[ao]|manual)[^/;]*',compact,re.I)
            engine_heading=next((flat(l) for l in layout.split('\n') if 'Motor' in l and 'R$' in l),None)
            engine_match=re.search(r'Motor\s+((?:\d[.,]\dL?(?:\s+Turbo)?(?:\s+Diesel)?(?:\s*-\s*4x4)?)|Turbo)',engine_heading or '',re.I)
            if not engine_match: engine_match=re.search(r'(\d[.,]\d\s+Turbo)',row['name'],re.I)
            fuel_match=re.search(r'100%\s*etanol|\bDiesel\b|\bFlex\b', ' '.join([title,engine_heading or '',compact]),re.I)
            seats=re.search(r'\b([257])\s*lugares\b',compact,re.I)
            if not seats and 'condutor + 1 passageiro' in compact: seat_count=2
            else:seat_count=int(seats[1]) if seats else None
            field_evidence={'name':row['name'],'engine':engine_match[0] if engine_match else None,'transmission':transmission[0] if transmission else None,'fuel':fuel_match[0] if fuel_match else None,'seatCount':seats[0] if seats else ('condutor + 1 passageiro' if seat_count==2 else None),'excelSelectionRow':selected[0]['row'],'pdfTitle':title}
            version={'slug':optional.lower().replace('/','-'),'name':row['name'],'displayName':row['name'],'modelCode':' / '.join(c['modelCode'] for c in configs),'configurationCode':optional,'optionalCode':optional,'engine':engine_match[1] if engine_match else None,'transmission':transmission[0].strip() if transmission else None,'fuel':fuel_match[0] if fuel_match else None,'seatCount':seat_count,'rawContent':content,'publicPriceNational':row['national'],'publicPriceZfm':row['zfm'],'sourcePage':page_no,'listNumber':list_no,'effectiveDate':effective,'sortOrder':order,'fieldEvidence':field_evidence,'matchingRule':'EXACT family + modelYear + approved page + optional codes + PDF model/configuration cells + list/effective date; equivalent model configurations grouped only when commercial content and prices match; no fuzzy matching','observations':'\n'.join(l.strip() for l in layout.split('\n') if l.strip().startswith(('*','A General Motors'))),'configurations':configs,'colors':colors}
            versions.append(version)
        except Exception as e:errors.append({'family':model['slug'],'optional':optional,'page':page_no,'reason':str(e) or type(e).__name__})
    models.append({'slug':model['slug'],'name':model['name'],'displayName':model['name'],'modelYear':model['year'],'category':model['category'],'sortOrder':len(models),'versions':versions})
report={'source':manifest,'modelsFound':len(models),'versionsFound':sum(len(m['versions']) for m in models),'ambiguous':ambiguous,'missing':errors,'pagesUsed':sorted(set(v['sourcePage'] for m in models for v in m['versions']))}
for directory in ['data/generated','data/reports']:(root/directory).mkdir(parents=True,exist_ok=True)
(root/'data/generated/chevrolet-catalog.json').write_text(json.dumps({'source':manifest['pdf'],'models':models},ensure_ascii=False,indent=2),encoding='utf-8')
(root/'data/reports/catalog-match-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for name,items in [('unmatched',errors),('ambiguous',ambiguous)]:
    import csv
    with (root/f'data/reports/catalog-{name}.csv').open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['family','optional','page','reason']);w.writeheader();w.writerows(items)
print(json.dumps({'models':len(models),'versions':report['versionsFound'],'ambiguous':ambiguous,'missing':errors},ensure_ascii=True))
if errors or ambiguous or report['versionsFound']!=40:raise SystemExit(1)
