from pathlib import Path
p=Path('scripts/sync-version-references.ts');s=p.read_text(encoding='utf-8');s=s.replace(" await copyFile('data/extracted/activ-official.png', `public${localPath}`)",""" try { await readFile('data/extracted/activ-official.png') } catch {
  const response = await fetch(sourceUrl, { redirect: 'error', signal: AbortSignal.timeout(30000) })
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Imagem oficial indisponível')
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 25000000) throw new Error('Imagem excede o limite')
  await mkdir('data/extracted', { recursive: true })
  await writeFile('data/extracted/activ-official.png', bytes)
 }
 await copyFile('data/extracted/activ-official.png', `public${localPath}`)""");p.write_text(s,encoding='utf-8')
p=Path('src/utils/api.ts');s=p.read_text(encoding='utf-8').replace("{ signal })","{ signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) })");p.write_text(s,encoding='utf-8')