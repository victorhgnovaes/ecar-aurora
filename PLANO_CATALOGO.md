# Integração auditável Chevrolet

Preservar React/Vite e CSS Modules existentes. Gerenciador: npm. Não há backend ou repositório Git inicializado.

1. Identificar fontes e remover exposição em public, preservando originais em data/sources.
2. Conferir imagens de seleção, ler somente identificação/opcionais de TABELA GM, extrair e renderizar PDF.
3. Registrar correspondência explícita por família, ano, códigos, lista e vigência. Bloquear ambiguidades.
4. Implementar PostgreSQL/Prisma, migrations, importador idempotente e relatórios com SHA-256.
5. Implementar API NestJS somente leitura, DTOs, CORS restrito e rate limit.
6. Sincronizar somente imagens oficiais, registrar fontes e faltantes sem recoloração artificial.
7. Conectar componentes existentes à API; estados de carregamento/erro/vazio; cores, Decimal e WhatsApp.
8. Validar integridade de 9 famílias/40 versões, importação repetida, API, interação, lint/build e documentação.

## Fontes identificadas
As duas imagens fornecidas têm nomes diferentes: WhatsApp Image 2026-09-19 at 18.14.49.jpeg e 18.15.00.jpeg. Conteúdo visual confirmado: mesma seleção de nove famílias e quarenta versões solicitadas. Nenhum valor comercial das imagens será importado.

## Ampliação autorizada: descontos
Em 20/09/2026 o usuário solicitou explicitamente analisar e publicar os descontos da planilha. Essa instrução substitui a proibição anterior de importar descontos do Excel. Importar somente o percentual da coluna E, vinculado à linha/família/código já conferidos. Preço público, pinturas e equipamentos continuam provenientes do PDF. Preservar 1,9% em E19 (Onix Pro A3X), sem transformar em 19%. Aplicar a fórmula percentual sobre preço público configurado, registrar divergências aritméticas dos totais armazenados no Excel e mostrar preço público, percentual, economia e preço com desconto em cards e configuração.
