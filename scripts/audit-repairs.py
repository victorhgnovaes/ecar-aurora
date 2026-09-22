from pathlib import Path
p=Path('scripts/build-catalog.py')
s=p.read_text(encoding='utf-8')
s=s.replace("r'Motor\\s+(\\d[.,]\\d(?:\\s+Turbo)?(?:\\s+Diesel)?(?:\\s*-\\s*4x4)?)'", "r'Motor\\s+((?:\\d[.,]\\dL?(?:\\s+Turbo)?(?:\\s+Diesel)?(?:\\s*-\\s*4x4)?)|Turbo)'" )
p.write_text(s,encoding='utf-8')
p=Path('server/catalog.service.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("}, include, orderBy: { sortOrder: 'asc' } })", "}, include: { ...include, versions: { ...include.versions, where: versionWhere } }, orderBy: { sortOrder: 'asc' } })")
p.write_text(s,encoding='utf-8')