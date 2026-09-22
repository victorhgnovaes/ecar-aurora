import pathlib, pypdfium2 as pdfium
from PIL import Image, ImageOps, ImageDraw
root = pathlib.Path(__file__).resolve().parents[1]
pdf = pdfium.PdfDocument(str(next((root/'data/sources').glob('*.pdf'))))
pages = [2,3,4,5,7,9,11,13,15,17,18,20,22,24,26,28,30,32,35,37,39,42,44,46,48,53,55,57,59,62,71,72]
out = root/'data/rendered'
out.mkdir(exist_ok=True, parents=True)
for number in pages:
    page = pdf[number-1]
    img = page.render(scale=1800/page.get_width()).to_pil().convert('RGB')
    img.save(out/f'page-{number:02}.png')
    page.close()
for offset in range(0,len(pages),4):
    group=pages[offset:offset+4]
    sheet=Image.new('RGB',(1800,1400),'#ddd')
    for i,n in enumerate(group):
        img=Image.open(out/f'page-{n:02}.png')
        img.thumbnail((900,660))
        x=(i%2)*900; y=(i//2)*700
        sheet.paste(img,(x,y+30)); ImageDraw.Draw(sheet).text((x+15,y+7),f'PDF PAGE {n}',fill='black')
    sheet.save(out/f'review-{offset//4+1}.jpg')
print('Rendered',len(pages),'pages')
