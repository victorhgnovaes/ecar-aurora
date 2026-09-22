# Auditoria Ecar / Aurora — 22/09/2026

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
196 associações têm arquivo de imagem: 195 de fontes Chevrolet e concessionárias autorizadas e 1 arquivo fornecido explicitamente pelo usuário. A origem deste último é Artvel Chevrolet, identificada nos metadados do download; não é apresentada como download do domínio Chevrolet Brasil.
24 combinações continuam sem imagem exata. Isso impede declarar a auditoria integralmente concluída. Fallbacks permanecem identificados; não foram pintadas fotos artificialmente nem ocultadas versões.

- onix / a5f / Azul Boreal
- onix / a5f / Prata Shark
- onix / a5f / Preto Ouro Negro
- onix / a5f / Vermelho Scarlet
- onix / a3x / Azul Boreal
- onix / a3x / Branco Summit
- onix / a3x / Prata Shark
- onix / a3x / Preto Ouro Negro
- onix / a3x / Vermelho Scarlet
- onix / r7y / Azul Boreal
- onix / r7y / Branco Summit
- onix / r7y / Preto Ouro Negro
- onix / r7y / Vermelho Scarlet
- s10 / r9d / Cinza Topázio
- s10 / r9d / Branco Summit
- s10 / r9d / Vermelho Scarlet
- s10 / r7f / Preto Ouro Negro
- s10 / r7f / Prata Shark
- s10 / r9d / Preto Ouro Negro
- s10 / r7f / Cinza Topázio
- s10 / r7f / Cinza Âmbar
- s10 / r7f / Branco Summit
- s10 / r7f / Branco Dunas
- s10 / r7f / Vermelho Scarlet
- s10 / r9d / Prata Shark
- s10 / r9d / Cinza Âmbar

## Deploy

Arquivos em `deploy/`, `compose.production.yml`, `.env.production.example` e `DEPLOY_LOCAWEB.md`. Backup privado atualizado em `.local/deploy/catalog.dump`.
Ainda não publicado: serviço contratado, domínio e acesso SSH não informados. Docker indisponível nesta estação; containers/HTTPS devem ser validados no servidor antes de anunciar publicação.

## Comandos executados

`npm install`, `npm audit --json`, `npm run catalog:import`, `npm run discounts:import`, `npm run images:sync`, `npm run catalog:audit`, `npm run test:api`, `npm test -- --pool=threads --maxWorkers=1`, `npm run test:idempotence`, `npx prisma validate`, `npx prisma migrate status`, `npm run lint`, `npm run api:build`, `npm run build`, `npm run test:e2e`, `npm run test:e2e -- --project=390x844 --grep Spark`, `node scripts/export-deploy-database.mjs`.

## Complemento de imagens — 22/09/2026

Onix LOG Branco Summit (foto traseira original de imprensa) e Onix Activ Prata Shark (foto oficial identificada como prata) associados. Fontes e regras registradas em `data/reviewed-image-manifest.json`; sincronização preserva as associações. Nenhuma recoloração. Permanecem 24 combinações exatas sem arquivo, conforme o relatório JSON.

## Imagens fornecidas pelo usuário — 22/09/2026

19 arquivos de Downloads incorporados e vinculados pelos nomes de versão e cor. Onix LOG A5F (incluindo `pratashark.png`), Onix PRO A3X e S10 WT manual R7F têm imagens para todas as cores. Onix Activ R7Y e S10 Chassis Cab R9D usam suas fotos prata como referência nas outras cores, conforme solicitado. São 211 associações com foto da cor e 9 com referência da própria versão; nenhuma seleção fica sem imagem. O aviso informa que a foto da cor não está disponível e orienta consultar a Ecar sobre a disponibilidade. Originais, nomes e checksums preservados no manifesto `data/user-image-overrides.json`; origem web não informada pelo usuário. Nenhuma recoloração realizada. Cobertura em `data/reports/user-image-coverage.json`.
