# Publicação na Locaweb

Pacote preparado para VPS/Cloud Linux com Docker Engine e Compose. Ainda não publicado: faltam serviço contratado, domínio e acesso SSH configurado. Docker não está disponível nesta estação; o build dos containers precisa ser validado no servidor.

O projeto usa React estático, API NestJS e PostgreSQL. Enviar apenas `dist` publica a interface, mas não fornece catálogo/API. Em Hospedagem de Sites compartilhada, confirme suporte a Node persistente e PostgreSQL; se não houver, mantenha a API/banco em um VPS.

## Arquivos preparados

- `compose.production.yml`: PostgreSQL 18 privado, API e Caddy.
- `deploy/Dockerfile`: Node 24, builds frontend/backend e imagem web separada.
- `deploy/Caddyfile`: HTTPS automático, `/api` e fallback das rotas React.
- `.env.production.example`: domínio, senha de produção e WhatsApp.
- `.dockerignore`: documentos internos e credenciais fora do build.

## Preparação

1. Configure um VPS/VM Linux com SSH, Docker e Compose. Aponte o registro A do domínio ao IP público. Libere 80/443; restrinja SSH ao acesso administrativo. API e banco não publicam portas externas.
2. Transfira o projeto por SSH/SFTP para um diretório privado, por exemplo `/opt/ecar-aurora`. Inclua `public/assets`, fontes, lockfile, migrations e arquivos de deploy. Não envie `node_modules`, `.env` local, `data/sources`, `references` ou `.local/postgres`.
3. No projeto local, gere o backup atual: `node scripts/export-deploy-database.mjs`. Envie somente `.local/deploy/catalog.dump` por SSH para o mesmo caminho privado no servidor. O dump contém dados do catálogo e descontos; não os documentos PDF/Excel.
4. No servidor, copie `.env.production.example` para `.env.production`, preencha `SITE_DOMAIN` (sem `https://`) e uma senha hexadecimal nova (por exemplo, gerada com `openssl rand -hex 24`). Mantenha `WHATSAPP_NUMBER=5511989266321`. Proteja o arquivo com `chmod 600 .env.production`.

## Primeira publicação, banco novo

Execute em Bash no diretório do projeto:

```sh
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml build
docker compose --env-file .env.production -f compose.production.yml up -d --wait db
docker compose --env-file .env.production -f compose.production.yml run --rm api npm run db:migrate
docker compose --env-file .env.production -f compose.production.yml exec -T db pg_restore --username=ecar --dbname=ecar_aurora --data-only --no-owner --no-privileges --exit-on-error --single-transaction < .local/deploy/catalog.dump
docker compose --env-file .env.production -f compose.production.yml up -d --wait
docker compose --env-file .env.production -f compose.production.yml ps
```

O restore acima é apenas para o banco recém-criado e vazio após migrations. Não o repita sobre um catálogo já populado. Não use `down -v`: isso remove os dados persistidos.

Valide `https://SEU_DOMINIO/api/catalog/meta` (9 modelos/40 versões), navegação direta em `/veiculos/s10`, imagens, seleção de cor, preço e destino WhatsApp. Nunca sirva a pasta raiz do projeto como diretório público; o container web contém somente `dist`.

## Atualização

Gere backup do banco antes de cada atualização. Atualize os arquivos, execute build, migrations e `up -d --wait`. Não refaça restore de dados automaticamente. Atualizações de PDF/Excel continuam sendo importadas e revisadas no ambiente privado antes da publicação.

Documentação da plataforma: https://www.locaweb.com.br/ajuda/wiki/deploy-de-aplicacoes-next-js-e-nuxt-js-ssr-no-locaweb-cloud/