const configuredNumber = import.meta.env.VITE_WHATSAPP_NUMBER?.trim() || '5511989266321'
export const site = { whatsappNumber: /^55\d{10,11}$/.test(configuredNumber) ? configuredNumber : '5511989266321' }
export interface Proposal { model: string; year: number; version: string; code: string; color: string; price: string; discountPercent?: string; discountAmount?: string; corporatePrice?: string }
export function whatsappUrl(proposal?: Proposal, apiNumber?: string | null) {
  const number = apiNumber && /^55\d{10,11}$/.test(apiNumber) ? apiNumber : site.whatsappNumber
  const message = proposal
    ? `Olá! Tenho interesse em uma condição corporativa para:\n\nModelo: ${proposal.model}\nAno/modelo: ${proposal.year}\nVersão: ${proposal.version}\nCódigo: ${proposal.code}\nCor: ${proposal.color}\nPreço público configurado: ${proposal.price}${proposal.corporatePrice ? `\nDesconto da planilha: ${proposal.discountPercent} (${proposal.discountAmount})\nPreço com desconto: ${proposal.corporatePrice}` : ''}\n\nEmpresa: Aurora Alimentos`
    : 'Olá! Sou colaborador(a) da Aurora e gostaria de conhecer as condições corporativas Chevrolet.'
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
