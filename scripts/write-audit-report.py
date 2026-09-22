from pathlib import Path
import json
root=Path('.')
audit=json.loads(Path('data/reports/site-audit.json').read_text(encoding='utf-8'))
pending=audit['images']['pending']
report='''# Auditoria Ecar / Aurora — 22/09/2026

## Correções aplicadas

- WhatsApp centralizado: 5511989266321, no frontend e nas variáveis da API.
- Motorização da S10 preserva `2.8L Diesel - 4x4`; Tracker informa apenas `Turbo`, como consta no PDF, sem inferir cilindrada.
- Faixa de preço da API agora restringe também as versões usadas para calcular a oferta do card.
- Filtro manual não confunde transmissão automática com opção de troca manual.
- API no frontend tem timeout de 15 segundos e mantém retry.
- Foto de referência específica do Onix Activ adicionada. Não foi atribuída a uma pintura sem comprovação.
- Spark Amarelo Canário usa o arquivo fornecido e aprovado pelo usuário. Conversão AVIF para PNG, sem recoloração. Origem e SHA-256 em `data/user-image-overrides.json`; sincronização preserva a associação.
- Dependências transitivas deepmerge-ts/mysql2 atualizadas com overrides; npm audit final: zero vulnerabilidades.
- API preparada para bind e proxy confiável configuráveis no deploy, preservando localhost como padrão local.

## Validações

- 9 testes de banco/API passaram, incluindo regressões de filtros e evidências do PDF.
- 15 testes React passaram. Execução no sandbox falhava ao iniciar workers; execução fora do sandbox passou.
- Fluxo E2E principal passou em 1440×900, 1280×800, 1024×768, 768×1024 e 390×844: catálogo, versão, pintura, imagem, preço, WhatsApp e ausência de overflow.
- E2E adicional do Spark amarelo passou em 390×844, verificando caminho, carregamento da imagem e mensagem do WhatsApp.
- Lint e builds frontend/backend passaram.
- Reimportação preservou todos os IDs e contagens; os 40 descontos foram reimportados sem divergências de cálculo na planilha.
- Prisma schema válido; três migrations aplicadas, banco atualizado.
- Auditoria das evidências de campos técnicos/pinturas: sem erros. Nenhum PDF/Excel/CSV em public.

## Catálogo e imagens

9 famílias, 40 versões, 46 configurações, 19 cores e 220 associações versão/cor.
192 associações têm arquivo de imagem: 191 de fontes Chevrolet e 1 arquivo fornecido explicitamente pelo usuário. A origem deste último é Artvel Chevrolet, identificada nos metadados do download; não é apresentada como download do domínio Chevrolet Brasil.
28 combinações continuam sem imagem exata. Isso impede declarar a auditoria integralmente concluída. Fallbacks permanecem identificados; não foram pintadas fotos artificialmente nem ocultadas versões.

'''
report+='\n'.join('- '+p['model']+' / '+p['version']+' / '+str(p['color']) for p in pending)
report+='''

## Deploy

Arquivos em `deploy/`, `compose.production.yml`, `.env.production.example` e `DEPLOY_LOCAWEB.md`. Backup privado atualizado em `.local/deploy/catalog.dump`.
Ainda não publicado: serviço contratado, domínio e acesso SSH não informados. Docker indisponível nesta estação; containers/HTTPS devem ser validados no servidor antes de anunciar publicação.

## Comandos executados

`npm install`, `npm audit --json`, `npm run catalog:import`, `npm run discounts:import`, `npm run images:sync`, `npm run catalog:audit`, `npm run test:api`, `npm test -- --pool=threads --maxWorkers=1`, `npm run test:idempotence`, `npx prisma validate`, `npx prisma migrate status`, `npm run lint`, `npm run api:build`, `npm run build`, `npm run test:e2e`, `npm run test:e2e -- --project=390x844 --grep Spark`, `node scripts/export-deploy-database.mjs`.
'''
Path('AUDITORIA.md').write_text(report,encoding='utf-8')
old=Path('RELATORIO_ENTREGA.md');backup=Path('.local/reports/RELATORIO_ENTREGA-antes-auditoria.md');backup.parent.mkdir(parents=True,exist_ok=True)
if not backup.exists(): backup.write_text(old.read_text(encoding='utf-8'),encoding='utf-8')
old.write_text(report,encoding='utf-8')
p=Path('README.md');s=p.read_text(encoding='utf-8');notice='''> Atualização de 22/09/2026: consulte [AUDITORIA.md](AUDITORIA.md) para o estado atual e [DEPLOY_LOCAWEB.md](DEPLOY_LOCAWEB.md) para publicação. WhatsApp: **55 11 98926-6321**. Spark amarelo integrado; 28 combinações de imagem ainda pendentes. E2E validado nas cinco resoluções; npm audit sem vulnerabilidades.

''';p.write_text(notice+s,encoding='utf-8')
p=Path('ASSET_SOURCES.md');s=p.read_text(encoding='utf-8');s+='''
## Imagens incorporadas na auditoria

- Onix Activ, referência da versão (sem atribuir cor): https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/cars/onix/refresh/versions/versiones-v3/desktop/3_activ_turbo_atdesk.png
- Spark Amarelo Canário: arquivo `cor-amarelo-canario-spark.avif`, fornecido e aprovado pelo usuário em 21/09/2026. Origem preservada: https://www.artvelchevrolet.com.br/content/dam/chevrolet/sa/br/pt/master/home/electric/spark-euv/colorizer/cor-amarelo-canario.jpg?imwidth=1920 . Conversão de formato para PNG, sem alteração de pintura, em `public/assets/vehicles/spark-euv-2026/pea/amarelo-canario/front-3q.png`. SHA-256 original e final no manifesto privado `data/user-image-overrides.json`. Esta é uma exceção explicitamente solicitada pelo usuário à regra inicial de domínios Chevrolet Brasil.

As contagens atuais e pendências estão em AUDITORIA.md e data/reports/site-audit.json.
''';p.write_text(s,encoding='utf-8')
p=Path('tests/catalog-api.test.ts');s=p.read_text(encoding='utf-8').replace('imagens disponíveis são locais, oficiais e têm checksum e dimensões reais','imagens locais têm origem oficial ou aprovação explícita, checksum e dimensões reais');p.write_text(s,encoding='utf-8')