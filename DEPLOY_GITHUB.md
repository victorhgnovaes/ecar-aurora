# Ecar Aurora

Versão de 22/09/2026: imagens fornecidas pelo usuário, layout responsivo,
ícone do WhatsApp nas cores Aurora e textos comerciais revisados.

O repositório contém frontend, API, migrations, imagens e dados do catálogo.
Credenciais, documentos originais, arquivos temporários e banco local não
são enviados ao GitHub. Os dados gerados do catálogo e os fixtures de teste
são versionados para preservar esta revisão.

## Próxima etapa: Vercel

O frontend usa `/api` para consultar a API NestJS e o PostgreSQL. Antes de
publicar na Vercel, é necessário configurar a hospedagem da API e o banco
de produção ou preparar uma adaptação específica para essa plataforma.
Importar apenas o frontend ainda não disponibiliza o catálogo online.

O build do frontend é `npm run build`, com saída em `dist`. O backup atualizado
do banco está em `.local/deploy/catalog.dump` e deve ser transferido por um
canal privado para o banco escolhido. Não envie esse backup ao GitHub.

## Atualizações futuras

```powershell
git add .
git commit -m "Descreva a atualização"
git push origin main
```
