import hashlib, json, pathlib, re, sys, zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

root = pathlib.Path(__file__).resolve().parents[1]
source = root / 'data/sources'
out = root / 'data/extracted'
out.mkdir(parents=True, exist_ok=True)
pdfs = list(source.glob('*.pdf'))
books = list(source.glob('*.xlsx'))
if len(pdfs) != 1 or len(books) != 1:
    raise RuntimeError('Esperado exatamente um PDF e um XLSX em data/sources')
pdf, book = pdfs[0], books[0]
reader = PdfReader(pdf)
pages = [{'page': i + 1, 'text': p.extract_text(extraction_mode='layout')} for i, p in enumerate(reader.pages)]
(out / 'pdf-pages.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding='utf-8')
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(book) as z:
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        strings = [''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', ns)]
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    sheet = next(s for s in wb.find('s:sheets', ns) if s.attrib['name'].strip() == 'TABELA GM')
    rid = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = next(r.attrib['Target'] for r in rels if r.attrib['Id'] == rid)
    target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
    rows = []
    for row in ET.fromstring(z.read(target)).findall('.//s:sheetData/s:row', ns):
        cells = []
        for cell in row:
            value = cell.find('s:v', ns)
            if value is None: continue
            raw = value.text or ''
            if cell.attrib.get('t') == 's': raw = strings[int(raw)]
            # Selection only: no numeric prices, formulas or discount columns are exported.
            if cell.attrib.get('t') == 's' and raw.strip(): cells.append({'cell': cell.attrib['r'], 'text': raw})
        if cells: rows.append({'row': row.attrib['r'], 'cells': cells})
    (out / 'excel-selection.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
manifest = {'pdf': {'fileName': pdf.name, 'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(), 'pageCount': len(pages)}, 'workbook': {'fileName': book.name, 'sha256': hashlib.sha256(book.read_bytes()).hexdigest(), 'sheet': 'TABELA GM'}, 'images': [{'fileName': p.name, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in source.glob('*.jpeg')]}
(out / 'source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False))
