import pathlib, zipfile, json, hashlib
import xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1]
book=next((root/'data/sources').glob('*.xlsx'))
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(book) as archive:
    strings=[''.join(n.itertext()) for n in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si',ns)]
    workbook=ET.fromstring(archive.read('xl/workbook.xml'))
    sheet=next(s for s in workbook.find('s:sheets',ns) if s.attrib['name'].strip()=='TABELA GM')
    rid=sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    target=next(r.attrib['Target'] for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels')) if r.attrib['Id']==rid)
    target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
    rows=[]
    for row in ET.fromstring(archive.read(target)).findall('.//s:sheetData/s:row',ns):
        cells=[]
        for cell in row:
            value=cell.find('s:v',ns); formula=cell.find('s:f',ns)
            if value is None:continue
            raw=value.text or ''
            if cell.attrib.get('t')=='s':raw=strings[int(raw)]
            cells.append({'cell':cell.attrib['r'],'value':raw,'type':cell.attrib.get('t','n'),'formula':formula.text if formula is not None else None})
        if cells:rows.append({'row':int(row.attrib['r']),'cells':cells})
result={'fileName':book.name,'sha256':hashlib.sha256(book.read_bytes()).hexdigest(),'sheet':'TABELA GM','rows':rows}
(root/'data/extracted/excel-discounts.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(rows[:16],ensure_ascii=True))
