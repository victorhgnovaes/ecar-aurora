> Atualização de 22/09/2026: consulte [AUDITORIA.md](AUDITORIA.md) para o estado atual e [DEPLOY_LOCAWEB.md](DEPLOY_LOCAWEB.md) para publicação. WhatsApp: **55 11 98926-6321**. Spark amarelo integrado; 9 cores usam a foto de referência da própria versão, com aviso para consultar a Ecar. E2E validado nas cinco resoluções; npm audit sem vulnerabilidades.

# Aurora Alimentos + Ecar Frotas

Hotsite Chevrolet com layout original preservado, API NestJS e PostgreSQL. Catálogo com 9 famílias, 40 versões comerciais, 46 configurações de fábrica, 19 pinturas e 220 associações versão/pintura. Os percentuais da planilha foram adicionados por solicitação expressa posterior do usuário.

## Executar neste computador

```powershell
cd "C:\Users\vihnd\Downloads\ecar.aurora\Ecar\Aurora"
npm.cmd run db:local:start
npm.cmd start
```

Site: http://localhost:5173. API: http://localhost:3001/api/vehicles. Deixe o terminal aberto. `npm start` usa a API compilada em `server/dist`; depois de editar o backend, execute `npm run api:build` e reinicie a API.

Para desenvolver em terminais separados, na pasta do projeto:

```powershell
# Terminal 1
npm.cmd run api:dev
# Terminal 2
npm.cmd run dev
```

Use `npm.cmd` no PowerShell caso a política do Windows bloqueie `npm.ps1`. Não é necessário alterar a política de execução.

## Tecnologias e instalação

React, TypeScript, Vite, React Router declarativo, CSS Modules, Lucide, clsx e Manrope local. Backend: NestJS, Prisma e PostgreSQL, DTOs, Helmet e rate limit. Dinheiro: NUMERIC/Prisma Decimal e decimal.js. Imagens: Sharp, sem recoloração.

Requisitos: Node 22.12+ (validado com Node 24), npm, Python 3.10+ e PostgreSQL 18. Docker Compose é opcional; Docker não está instalado neste computador. O cluster exclusivo local fica em `.local/postgres`, porta 55432, com credenciais privadas em `.env`.

Em outro ambiente:

```sh
npm install
python -m pip install -r requirements.txt
```

Crie `.env` a partir de `.env.example` somente se não existir; preserve credenciais existentes. Configure `DATABASE_URL`, `PORT`, `PUBLIC_SITE_URL`, `WHATSAPP_NUMBER` e `PYTHON_EXECUTABLE`. Nunca exponha `DATABASE_URL` em variável `VITE_`.

Para criar um banco novo via Docker:

```sh
npm run db:up
npm run db:generate
npm run db:migrate
npm run catalog:import
npm run discounts:import
npm run images:sync
npm run api:build
npm start
```

As credenciais do Compose/`.env.example` são exemplos locais. Altere `POSTGRES_PASSWORD` e `DATABASE_URL` juntos. Use somente uma instalação PostgreSQL na porta 55432. Migrations são aplicadas com `migrate deploy`; não resete bancos com dados. `db:seed` executa a importação idempotente do catálogo.

## Fontes, preços e descontos

Os quatro documentos fornecidos ficam em `data/sources`, fora de `public` e de `dist`. As duas imagens têm nomes WhatsApp diferentes dos UUIDs informados, mas seu conteúdo foi conferido. Vite bloqueia acesso às fontes e pastas internas.

- `data/whitelist.json`: famílias, opcionais e páginas aprovadas.
- `data/source-review.json`: hash e páginas conferidas visualmente.
- `scripts/import-chevrolet-catalog.ts`: extração, validação e importação em transação.
- `scripts/import-discounts.ts`: percentuais da coluna E da aba TABELA GM, conferidos por família, opcional, linha e preço base.
- `data/generated/chevrolet-catalog.json`: intermediário auditável do PDF.
- `data/reports/catalog-import-report.json`: contagens, páginas e SHA-256.
- `data/reports/catalog-unmatched.csv` e `catalog-ambiguous.csv`: falhas de correspondência.
- `data/reports/discount-import-report.json`: células, percentuais, hash e conferência aritmética.

Preço público, acréscimos individuais de pintura e equipamentos vêm exclusivamente do PDF. Somente o percentual de desconto vem do Excel, conforme a ampliação autorizada do escopo. Nada é completado com especificações externas. Dados ausentes ficam nulos e Conteúdo mantém o texto original extraído.

```text
Preço público configurado = preço nacional da versão + acréscimo nacional da cor
Economia = preço público configurado × percentual da planilha (centavos, HALF_UP)
Preço com desconto = preço público configurado − economia
```

A planilha identifica venda funcional de setembro/2026. As fórmulas aplicam o percentual também à pintura. E19, Onix Pro A3X, contém **1,9%, não 19%**; o sistema preserva 1,9%. Descontos zero são zero. Uma divergência do preço base Excel/PDF bloqueia a importação de descontos. Um novo PDF desativa os descontos anteriores até nova conferência.

Para atualizar fontes, preserve os originais em armazenamento privado, mantenha um PDF ativo em `data/sources`, execute extração/renderização, confira visualmente as páginas e ajuste explicitamente whitelist e `source-review.json`. Um novo hash bloqueia publicação sem revisão. Execute `catalog:import`, `discounts:import`, `images:sync`, validações e testes. Não há correspondência fuzzy nem publicação silenciosa de ambiguidades.

## Imagens e logos

Logos oficiais em `public/assets/logos/aurora.png` e `ecar.png`; substitua apenas pelos arquivos oficiais, preservando proporções. Não há capturas usadas como interface.

Fotos locais: `public/assets/vehicles/{modelo}-{ano}/{versao}/{cor}/front-3q.png`. `data/image-manifest.json` contém URLs oficiais e regras de associação; a tabela `vehicle_images` registra domínio, checksum, dimensões e status. `images:sync` baixa originais para armazenamento privado e gera PNG otimizado sem alterar a pintura. Não há hotlinks no frontend.

`images:manifest` reconstrói o manifesto a partir dos metadados oficiais previamente extraídos pelos scripts de descoberta. Para adicionar uma combinação faltante, registre a URL oficial correta no manifesto e execute `images:sync`, conferindo ano, versão, cor e ângulo.

Ainda existem combinações exatas sem imagem localizada, listadas em `data/reports/image-assets-report.json`. Elas mostram referência do modelo com aviso; isso não significa que aquela cor foi concluída. Pendências incluem versões Onix LOG/Pro/Activ, S10 Chassi/WT manual e Spark Amarelo Canário. Não são pintadas imagens artificialmente.

## Rotas e API

Frontend: `/`, `/inicio`, `/veiculos`, `/veiculos/:slug` e 404. Como funciona e Dúvidas são seções de `/inicio`. Há loading, erro com retry, filtros, seletores e modais acessíveis.

API somente GET:

```text
/api/vehicles
/api/vehicles/:slug
/api/vehicles/:slug/versions
/api/versions/:id
/api/versions/:id/colors
/api/versions/:id/specifications
/api/catalog/meta
```

Filtros: `category`, `family`, `year`, `transmission`, `fuel`, `minPrice`, `maxPrice`, `search`. A faixa de preço usa o preço público nacional. Parâmetros desconhecidos/inválidos recebem 400; registros ausentes recebem 404. Valores monetários são strings decimais. CORS usa somente `PUBLIC_SITE_URL`; limite de 180 requisições/minuto/IP. Não há rotas públicas de escrita nem acesso direto do React ao banco.

## WhatsApp

Altere `WHATSAPP_NUMBER` na `.env` do servidor: somente dígitos, 55 + DDD + número. A API fornece o contato. O fallback `VITE_WHATSAPP_NUMBER` e a função de URL ficam centralizados em `src/config/site.ts`. Substitua o exemplo 5511999999999 pelo telefone real antes da publicação.

A mensagem contém modelo, ano, versão, códigos, cor, preço público, percentual, economia e preço com desconto. Usa `encodeURIComponent`, nova aba e `noopener noreferrer`. O site prepara a mensagem; não envia automaticamente.

## Testes e build

```sh
npm run lint
npm run build
npm run api:build
npm run catalog:validate
npm run test:api
npm test
npm run test:idempotence
npm run test:http
```

`test:api` exige banco populado e gera fixtures reais usadas nos testes React. `test:http` exige API ativa. Idempotência reimporta o catálogo e confere todos os IDs/contagens; execute em desenvolvimento. Os testes de descontos verificam células originais e cálculo por pintura.

O cenário `e2e/catalog.spec.ts` percorre catálogo → versão → cor → preço → WhatsApp e verifica overflow em 1440×900, 1280×800, 1024×768, 768×1024 e 390×844:

```sh
npx playwright install chromium
npm run test:e2e
```

O WhatsApp é interceptado no teste e nada é enviado. A execução E2E e a revisão visual no navegador estão pendentes neste ambiente: o navegador integrado não disponibilizou conexão. Testes React não substituem a revisão visual de responsividade.

## Organização e próximos passos

`src/`: componentes originais, páginas, hooks de API, tipos e estilos. `server/`: DTOs, serviço e controllers. `prisma/`: schema e migrations. `scripts/`: importação, imagens e validação. `data/`: fontes/relatórios privados. `public/assets/`: somente imagens do site. Documentação anterior e mocks preservados em `data/legacy`.

Para editar veículos, atualize as fontes e as regras de importação, mantendo rastreabilidade. Não altere mocks: a interface consome a API. Próximos passos: painel autenticado, permissões, histórico de aprovação/publicação, revisão de vigência comercial, gestão de imagens e backups. Não há painel administrativo, autenticação de usuários, pagamentos ou armazenamento de leads nesta etapa.
