# Fontes dos assets

Logos oficiais fornecidas pelo usuário: `Downloads/aurora-logo.png` e `Downloads/ecar-frotas-logo.png`, copiadas sem alteração para `public/assets/logos`.

Quatro referências identificadas visualmente e preservadas em `references/`, extraídas de `WhatsApp Unknown 2026-09-19 at 22.12.53.zip`: entrada (`20.31.12`), Início (`20.31.12 (1)`), catálogo (`20.31.12 (2)`) e configurador (`20.31.13`). Nenhuma captura é usada na interface.

Imagens consultadas e baixadas em 19/09/2026 exclusivamente da Chevrolet Brasil:

- Página: https://www.chevrolet.com.br/monte-o-seu
- Base dos arquivos: https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/monte-o-seu/
- `onix.png` → `onix.png`
- `onixplus.png` → `onix-plus.png`
- `tracker.png` → `tracker.png`
- `montana_2026_jelly.png` → `montana.png`
- `spin.png` → `spin.png`
- S10: página https://www.chevrolet.com.br/picapes/s10
- Arquivo: https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/portable-navigation/jellys/05-images/s10-2027-flyout-jelly.jpg → `s10.jpg`

As fotos atuais não correspondem exatamente aos anos e às cores das referências. Para fidelidade integral, substituir pelos recortes oficiais aprovados, especialmente S10 azul e SUV prata. Não foram aplicadas recolorações artificiais.

## Recorte transparente da hero

s10-hero.png deriva da foto oficial s10.jpg indicada acima. Fundo removido com image_gen em modo de edicao, com instrucao para preservar carro, pintura, angulo e detalhes e gerar alpha real. PNG validado com canal alpha e transparencia. Original preservado.


## Imagens incorporadas na auditoria

- Onix Activ, referência da versão (sem atribuir cor): https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/cars/onix/refresh/versions/versiones-v3/desktop/3_activ_turbo_atdesk.png
- Spark Amarelo Canário: arquivo `cor-amarelo-canario-spark.avif`, fornecido e aprovado pelo usuário em 21/09/2026. Origem preservada: https://www.artvelchevrolet.com.br/content/dam/chevrolet/sa/br/pt/master/home/electric/spark-euv/colorizer/cor-amarelo-canario.jpg?imwidth=1920 . Conversão de formato para PNG, sem alteração de pintura, em `public/assets/vehicles/spark-euv-2026/pea/amarelo-canario/front-3q.png`. SHA-256 original e final no manifesto privado `data/user-image-overrides.json`. Esta é uma exceção explicitamente solicitada pelo usuário à regra inicial de domínios Chevrolet Brasil.

As contagens atuais e pendências estão em AUDITORIA.md e data/reports/site-audit.json.

## Correspondências revisadas em 22/09/2026

`data/reviewed-image-manifest.json` registra duas associações adicionais: Onix LOG Branco Summit, foto oficial `Onix_log_2.jpg` do newsroom Chevrolet (vista traseira mantida), e Onix Activ Prata Shark, arquivo `3_activ_turbo_atdesk.png` cuja legenda oficial identifica Activ prata. As páginas do PDF apresentam somente uma opção branca/prata para cada uma dessas versões, respectivamente. As regras são explícitas e as imagens não foram recoloridas. A imagem de imprensa `Activ_1.jpg` apresentou artefatos na inspeção e foi descartada para publicação.

## Revisão adicional — 22/09/2026

Instaladas as fotos do Onix Pro A3X Prata Shark (Artvel, seção oficial Onix Pro 2027) e S10 WT MT R7F Preto Ouro Negro (Chevrolet Brasil, imagem identificada como WT MT 2027). URLs completas, páginas e critérios constam de `data/reviewed-image-manifest.json`. Originais preservados em `data/extracted/final-image-search/`. Somente conversão de formato e redução de tamanho, sem recoloração. Auditoria: 196 associações prontas, 24 pendentes, nenhum erro.

Descartados após inspeção: o seletor da Granleste reutiliza imagens do Onix comum em Pro/Activ (inclusive Activ sem rack); a Américas identifica como Chassis R9D uma imagem com caçamba; a foto Chassi da Cotac corresponde à frente antiga. Nenhuma dessas imagens foi publicada como correspondência exata.

## Imagens fornecidas pelo usuário — 22/09/2026

19 arquivos de Downloads incorporados e vinculados pelos nomes de versão e cor. Onix LOG A5F (incluindo `pratashark.png`), Onix PRO A3X e S10 WT manual R7F têm imagens para todas as cores. Onix Activ R7Y e S10 Chassis Cab R9D usam suas fotos prata como referência nas outras cores, conforme solicitado. São 211 associações com foto da cor e 9 com referência da própria versão; nenhuma seleção fica sem imagem. O aviso informa que a foto da cor não está disponível e orienta consultar a Ecar sobre a disponibilidade. Originais, nomes e checksums preservados no manifesto `data/user-image-overrides.json`; origem web não informada pelo usuário. Nenhuma recoloração realizada. Cobertura em `data/reports/user-image-coverage.json`.
