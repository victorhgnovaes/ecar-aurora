import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from './App'
import type { Vehicle, VehicleSummary } from './types/vehicle'
import { finalPrice, formatMoney, discountedPrice, formatPercent } from './utils/money'
import { billingStates } from '#conditions'
const fixture: { summaries: VehicleSummary[]; details: Vehicle[] } = JSON.parse(readFileSync('data/generated/api-fixtures.json','utf8'))
beforeEach(() => {
  window.scrollTo = vi.fn()
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  vi.stubGlobal('fetch',vi.fn(async (url:string) => {
    const path=url.replace('/api','')
    const data=path==='/vehicles'?fixture.summaries:path==='/catalog/meta'?{whatsappNumber:'5511989266321'}:fixture.details.find(m=>path===`/vehicles/${m.slug}`)
    return {ok:!!data,status:data?200:404,json:async()=>data}
  }))
})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
function open(path: string) { window.history.replaceState({}, '', path); render(<App />) }
test('entrada, início, catálogo com nove famílias, busca e filtros', async () => {
 const user=userEvent.setup();open('/');await user.click(screen.getByRole('link',{name:'Ver veículos'}));await screen.findByRole('heading',{name:'Modelos em destaque'})
 await user.click(screen.getByRole('link',{name:'Ver todos os veículos'}));await screen.findByText('9 modelos encontrados')
 await user.click(screen.getByRole('button',{name:'Picape'}));expect(screen.getByRole('status')).toHaveTextContent('2 modelos')
 await user.type(screen.getByRole('searchbox'),'S10');expect(screen.getByRole('status')).toHaveTextContent('1 modelo')
 await user.type(screen.getByRole('searchbox'),'xyz');expect(screen.getByRole('heading',{name:'Nenhum modelo encontrado'})).toBeInTheDocument()
})
test('cor altera imagem, adicional, preço e WhatsApp; modal e modelo funcionam',async()=>{
 const user=userEvent.setup();const model=fixture.details.find(m=>m.slug==='onix')!
 const version=model.versions.find(v=>v.colors.filter(c=>c.imageStatus==='READY').length>=2)!
 expect(version).toBeDefined();open('/veiculos/onix');await screen.findByLabelText('Versão');await user.selectOptions(screen.getByLabelText('Versão'),version.id)
 const available=version.colors.filter(c=>c.imageStatus==='READY');const first=available[0];const other=available.find(c=>c.additional!==first.additional)!
 await user.click(screen.getByRole('radio',{name:first.name}));const image=screen.getByAltText(`Chevrolet ${model.name}, ${version.name}, ${first.name}`);expect(image).toHaveAttribute('src',first.image)
 await user.click(screen.getByRole('radio',{name:other.name}));expect(screen.getByAltText(`Chevrolet ${model.name}, ${version.name}, ${other.name}`)).toHaveAttribute('src',other.image)
 expect(other.image).not.toBe(first.image);expect(screen.getByTestId('final-price').textContent).toBe(formatMoney(finalPrice(version.publicPriceNational,other.additional)))
 expect(version.discount).not.toBeNull()
 const expected=discountedPrice(other.finalPrice,version.discount!.rate)
 expect(screen.getByTestId('corporate-price').textContent).toBe(formatMoney(expected.corporatePrice))
 const link=within(screen.getByRole('complementary')).getByRole('link',{name:'Solicitar proposta'});const url=new URL(link.getAttribute('href')!);const message=url.searchParams.get('text')!
 for(const text of [model.name,version.name,other.name,formatMoney(other.finalPrice),String(model.modelYear)])expect(message).toContain(text)
 expect(message).toContain(formatMoney(expected.corporatePrice));expect(message).toContain(formatPercent(version.discount!.rate))
 expect(url.pathname).toBe('/5511989266321');expect(url.hostname).toBe('wa.me');expect(link).toHaveAttribute('rel','noopener noreferrer')
 await user.click(screen.getByRole('button',{name:'Itens de série'}));expect(screen.getByRole('dialog')).toHaveTextContent(version.rawContent.replace(/\s+/g,' '))
 await user.click(screen.getByRole('button',{name:'Fechar painel'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 await user.selectOptions(screen.getByLabelText('Modelo'),'spin');await screen.findByText(/Spin 2027/,{selector:'dd'})
})
test('cores de mesmo acréscimo continuam trocando imagem',async()=>{
 const user=userEvent.setup();const model=fixture.details.find(m=>m.slug==='captiva-ev')!;const version=model.versions[0]
 const ready=version.colors.filter(c=>c.imageStatus==='READY');expect(ready.length).toBeGreaterThan(1)
 const a=ready[0];const b=ready.find(c=>c.id!==a.id&&c.additional===a.additional)!
 open('/veiculos/captiva-ev');await screen.findByLabelText('Versão');await user.click(screen.getByRole('radio',{name:a.name}));const before=screen.getByTestId('final-price').textContent
 await user.click(screen.getByRole('radio',{name:b.name}));expect(screen.getByAltText(`Chevrolet ${model.name}, ${version.name}, ${b.name}`)).toHaveAttribute('src',b.image);expect(a.image).not.toBe(b.image);expect(screen.getByTestId('final-price').textContent).toBe(before)
})
test.each([['onix','r7y'],['s10','r9d']])('foto de referência e consulta à Ecar para %s/%s',async(slug,code)=>{
 const user=userEvent.setup();const model=fixture.details.find(m=>m.slug===slug)!
 const version=model.versions.find(v=>v.slug===code)!
 const missing=version.colors.find(c=>c.imageStatus==='MISSING')!
 const silver=version.colors.find(c=>c.slug==='prata-shark')!
 open(`/veiculos/${slug}`);await screen.findByLabelText('Versão')
 await user.selectOptions(screen.getByLabelText('Versão'),version.id)
 await user.click(screen.getByRole('radio',{name:missing.name}))
 expect(screen.getByText(/Em caso de dúvida sobre a disponibilidade desta cor, consulte a Ecar/)).toHaveTextContent(missing.name)
 expect(screen.getByAltText(/Imagem de referência/)).toHaveAttribute('src',`/assets/vehicles/${slug}-2027/${code}/reference.png`)
 await user.click(screen.getByRole('radio',{name:silver.name}))
 expect(screen.queryByText(/Em caso de dúvida sobre a disponibilidade desta cor/)).not.toBeInTheDocument()
 expect(screen.getByAltText(`Chevrolet ${model.name}, ${version.name}, ${silver.name}`)).toHaveAttribute('src',silver.image)
})

test.each(fixture.summaries.map(m=>m.slug))('rota /veiculos/%s',async slug=>{open(`/veiculos/${slug}`);expect(await screen.findByRole('heading',{name:'Monte seu Chevrolet'})).toBeInTheDocument()})
test.each(['/inexistente','/veiculos/inexistente'])('404 %s',async path=>{open(path);expect(await screen.findByRole('heading',{name:/Vamos encontrar/})).toBeInTheDocument()})
test('erro de API oferece nova tentativa',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));open('/veiculos');expect(await screen.findByRole('button',{name:'Tentar novamente'})).toBeInTheDocument()})

test('condição dependente de UF exige seleção e substitui o percentual na simulação e proposta',async()=>{
 const user=userEvent.setup()
 const model=structuredClone(fixture.details.find(m=>m.slug==='spark-euv')!)
 // Synthetic MY27 response verifies the future UI path; no catalog records are created.
 model.modelYear=2027
 const version=model.versions[0]
 version.discount={...version.discount!,rate:'0.148000',referenceMonth:'2026-10',pendingReason:null,requiresBillingState:true,stateRates:{MA:'0.098000',AC:'0.098000',DF:'0.113000',SE:'0.113000',RO:'0.113000',AP:'0.113000',PB:'0.113000'}}
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,status:200,json:async()=>url.includes('catalog/meta')?{whatsappNumber:'5511989266321'}:url.endsWith('/vehicles')?fixture.summaries:model})))
 open('/veiculos/spark-euv');await screen.findByLabelText('UF de faturamento')
 expect(screen.queryByTestId('corporate-price')).not.toBeInTheDocument()
 expect(screen.getByText('Informe a UF de faturamento para calcular o preço com desconto.')).toBeInTheDocument()
 for(const uf of billingStates){
  await user.selectOptions(screen.getByLabelText('UF de faturamento'),uf)
  const rate=version.discount.stateRates![uf] || version.discount.rate
  const expected=discountedPrice(finalPrice(version.publicPriceNational,version.colors[0].additional),rate)
  expect(screen.getByTestId('corporate-price').textContent).toBe(formatMoney(expected.corporatePrice))
  const message=new URL(screen.getByRole('link',{name:'Solicitar proposta'}).getAttribute('href')!).searchParams.get('text')!
  expect(message).toContain(`UF de faturamento: ${uf}`);expect(message).toContain(formatPercent(rate));expect(message).toContain(formatMoney(expected.corporatePrice));expect(message).toContain('2026-10')
 }
},20000)

test('Spark MY26 preservado não publica desconto MY27 nem valor final enquanto pendente',async()=>{
 open('/veiculos/spark-euv');await screen.findByLabelText('Versão')
 expect(screen.queryByTestId('corporate-price')).not.toBeInTheDocument()
 expect(screen.getByText(/Condição de outubro\/2026 em conferência/)).toBeInTheDocument()
 const message=new URL(screen.getByRole('link',{name:'Solicitar proposta'}).getAttribute('href')!).searchParams.get('text')!
 expect(message).toContain('Ano/modelo: 2026');expect(message).toContain('Condição pendente:');expect(message).not.toContain('Preço com desconto:')
})

test('Captiva exige código de fábrica e não estende condição do 1AAE4PEA ao 5AAE4PEA',async()=>{
 const user=userEvent.setup();open('/veiculos/captiva-ev');await screen.findByLabelText('Código de fábrica')
 expect(screen.queryByTestId('corporate-price')).not.toBeInTheDocument()
 await user.selectOptions(screen.getByLabelText('Código de fábrica'),'1AAE4PEA')
 expect(screen.getByTestId('corporate-price').textContent).toBe(formatMoney('197991.00'))
 let message=new URL(screen.getByRole('link',{name:'Solicitar proposta'}).getAttribute('href')!).searchParams.get('text')!
 expect(message).toContain('1AAE4T / PEA');expect(message).not.toContain('5AAE4T / PEA');expect(message).toContain('10%')
 await user.selectOptions(screen.getByLabelText('Código de fábrica'),'5AAE4PEA')
 expect(screen.queryByTestId('corporate-price')).not.toBeInTheDocument()
 message=new URL(screen.getByRole('link',{name:'Solicitar proposta'}).getAttribute('href')!).searchParams.get('text')!
 expect(message).toContain('5AAE4T / PEA');expect(message).not.toContain('Preço com desconto:')
})
