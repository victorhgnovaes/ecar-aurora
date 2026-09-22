import fs from 'node:fs/promises'
const modal='src/components/ui/Modal.tsx'
let text=await fs.readFile(modal,'utf8')
text=text.replace('<p className={s.notice}>Informações extraídas da lista pública Chevrolet. Campos ausentes no documento são identificados abaixo.</p>','')
await fs.writeFile(modal,text)
const page='src/pages/VehicleConfiguratorPage/VehicleConfiguratorPage.tsx'
text=await fs.readFile(page,'utf8')
text=text.replace(/\s*<p className=\{s.disclaimer\}>Fonte: \{version.source.fileName\}[^\n]*<\/p>/,'')
text=text.replaceAll('Não informado no documento','Consulte a Ecar')
text=text.replace('Desconto: {version.discount.sourceTitle}. Aplicado ao preço público e à pintura do PDF. Condição sujeita à confirmação no atendimento.','Desconto aplicado ao preço do veículo e à pintura selecionada. Consulte a Ecar para confirmar as condições comerciais.')
await fs.writeFile(page,text)
const money='src/utils/money.ts'
text=await fs.readFile(money,'utf8')
await fs.writeFile(money,text.replaceAll('Não informado no documento','Consulte a Ecar'))
