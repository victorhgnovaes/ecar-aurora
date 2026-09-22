import pathlib,json,pdfplumber,re
root=pathlib.Path(__file__).resolve().parents[1]
whitelist=json.loads((root/'data/whitelist.json').read_text(encoding='utf-8'))
pages=sorted(set(v[1] for m in whitelist for v in m['versions']))
result=[]
with pdfplumber.open(next((root/'data/sources').glob('*.pdf'))) as pdf:
    for n in pages:
        p=pdf.pages[n-1]
        tables=[{'bbox':t.bbox,'rows':t.extract(x_tolerance=1)} for t in p.find_tables()]
        result.append({'page':n,'tables':tables,'text':p.extract_text()})
(root/'data/extracted/pdf-tables.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
for p in result:
    for t in p['tables']:
        for row in t['rows']:
            if any(re.search(r'\b[1-9][A-Z0-9]{5}\b',c or '') for c in row[:4]):
                print(p['page'],json.dumps([c if not c or len(c)<150 else c[:35]+'...' for c in row],ensure_ascii=True))
