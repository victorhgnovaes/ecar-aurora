# Ecar Aurora

Versão de 22/09/2026: imagens fornecidas pelo usuário, layout responsivo,
ícone do WhatsApp nas cores Aurora e textos comerciais revisados.

O repositório contém frontend, API, migrations, imagens e dados do catálogo.
Credenciais, documentos originais, arquivos temporários e banco local não
são enviados ao GitHub. Os dados gerados do catálogo e os fixtures de teste
são versionados para preservar esta revisão.

## Deploy na Vercel

O `vercel.json` configura `npm run build:vercel` e a saída `dist`. Esse build
publica o catálogo revisado junto com o site, sem depender da API local na
porta 3001 ou de PostgreSQL em produção. São 9 modelos e 40 versões, com
cores, preços, descontos e imagens.

Os dados são exportados das respostas reais da API em
`data/generated/api-fixtures.json`, também usado pelos testes. O build verifica
as imagens e gera `dist/catalog`. Uma `VITE_API_URL` antiga é ignorada nesse modo.

Na Vercel, use a raiz do repositório. Remova overrides antigos de Build Command
ou configure `npm run build:vercel`; Output Directory: `dist`. Faça um novo
deploy após enviar a correção ao GitHub. As rotas internas têm fallback para
a aplicação, enquanto arquivos ausentes do catálogo retornam 404.

Para testar sem API: `npm run build:vercel` e `npm run preview`.
Confira `/inicio`, `/veiculos`, `/veiculos/onix` e `/catalog/vehicles.json`.

### Atualizar o catálogo publicado

O site usa os dados do último deploy. Após importar e revisar alterações no
banco local, com a API local funcionando, execute:

```powershell
npm run catalog:export:static
npm run build:vercel
npm test
```

Revise o diff de `data/generated/api-fixtures.json` e envie ao GitHub para
gerar o novo deploy. O exportador copia apenas as respostas públicas da API.
Nunca publique `.env`, documentos originais ou backups do banco.

`npm run dev` e `npm run build` continuam usando a API NestJS/PostgreSQL.
Para um catálogo atualizado dinamicamente, hospede esses serviços e use o
build normal com `VITE_API_URL` apontando para a API pública. Consulte
`DEPLOY_LOCAWEB.md` para o modo com servidor e banco.

## Atualizações futuras

```powershell
git add .
git commit -m "Descreva a atualização"
git push origin main
```
