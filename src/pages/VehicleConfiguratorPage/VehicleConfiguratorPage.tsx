import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Check, ChevronRight, ClipboardList, Settings, Tag } from 'lucide-react'
import clsx from 'clsx'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Modal } from '../../components/ui/Modal'
import { WhatsAppIcon } from '../../components/ui/WhatsAppIcon'
import { VehicleImage } from '../../components/vehicles/VehicleImage'
import { useCatalog, useVehicle } from '../../hooks/useCatalog'
import { finalPrice, formatMoney, discountedPrice, formatPercent } from '../../utils/money'
import { whatsappUrl } from '../../config/site'
import { NotFoundPage } from '../NotFoundPage/NotFoundPage'
import type { Vehicle, VehicleSelection } from '../../types/vehicle'
import s from './VehicleConfiguratorPage.module.css'

export function VehicleConfiguratorPage() {
  const { slug } = useParams()
  const { vehicle, loading, error, retry } = useVehicle(slug)
  if (loading) return <div className="container catalog-skeleton" role="status" aria-label="Carregando configuração"><div /><div /></div>
  if (error === 404) return <NotFoundPage />
  if (error || !vehicle) return <div className="container catalog-error" role="alert"><h2>Veículo indisponível</h2><p>Não foi possível carregar esta configuração.</p><button className="button" onClick={retry}>Tentar novamente</button></div>
  if (!vehicle.versions.length) return <div className="container catalog-error"><h2>Versões em atualização</h2><Link to="/veiculos">Voltar ao catálogo</Link></div>
  return <Configurator key={vehicle.id} vehicle={vehicle} />
}

function Configurator({ vehicle }: { vehicle: Vehicle }) {
  const navigate = useNavigate()
  const { vehicles, whatsappNumber } = useCatalog()
  const [versionId, setVersionId] = useState(vehicle.versions[0].id)
  const version = vehicle.versions.find(v => v.id === versionId) || vehicle.versions[0]
  const [colorId, setColorId] = useState(version.colors[0]?.id)
  const color = version.colors.find(c => c.id === colorId) || version.colors[0]
  const [panel, setPanel] = useState<'features' | 'technical' | null>(null)
  const selection: VehicleSelection = { modelId: vehicle.id, versionId: version.id, paintColorId: color?.id || '', region: 'NATIONAL', finalPrice: finalPrice(version.publicPriceNational, color?.additional || '0') }
  const corporate = version.discount ? discountedPrice(selection.finalPrice, version.discount.rate) : null
  const currentImage = color?.image || vehicle.image
  const exactImage = color?.imageStatus === 'READY'
  const code = color?.allowedOptionalCodes.length ? color.allowedOptionalCodes.join(' / ') : version.optionalCode
  const factoryCodes = version.configurations.filter(configuration => !color || color.allowedOptionalCodes.includes(configuration.optionalCode)).map(configuration => `${configuration.modelCode} / ${configuration.optionalCode}`).join('; ')
  const proposal = whatsappUrl({ model: vehicle.name, year: vehicle.modelYear, version: version.name, code: factoryCodes, color: color?.name || 'Não selecionada', price: formatMoney(selection.finalPrice), discountPercent: version.discount ? formatPercent(version.discount.rate) : undefined, discountAmount: corporate ? formatMoney(corporate.discountAmount) : undefined, corporatePrice: corporate ? formatMoney(corporate.corporatePrice) : undefined }, whatsappNumber)
  useEffect(() => {
    const urls = [...new Set([currentImage, ...version.colors.map(c => c.image)])].slice(0, 4)
    urls.forEach(src => { const image = new Image(); image.src = src })
  }, [currentImage, version.colors])
  return <div className={clsx('decorated', s.page)}><div className="container">
    <div className="page-heading"><Breadcrumb configuration /><h1>Monte seu <span className="accent">Chevrolet</span></h1><p>Escolha o modelo, a versão e a cor. Nós cuidamos do restante.</p></div>
    <div className={s.layout}><div className={s.main}>
      <ol className={s.steps} aria-label="Etapas da configuração">{['Modelo', 'Versão', 'Cor', 'Proposta'].map((label, i) => <li key={label} aria-current={i === 2 ? 'step' : undefined}><span className={clsx(s.stepCircle, i < 3 && s.complete, i === 2 && s.current)}>{i < 2 ? <Check size={20} /> : i + 1}</span><span>{label}</span></li>)}</ol>
      <section className={s.vehiclePanel} aria-label="Configuração do veículo">
        <div className={s.selects}><label>Modelo<select value={vehicle.slug} onChange={e => navigate(`/veiculos/${e.target.value}`)}>{(vehicles.length ? vehicles : [vehicle]).map(model => <option key={model.id} value={model.slug}>{model.name} {model.modelYear}</option>)}</select></label><label>Versão<select value={version.id} onChange={e => { setVersionId(e.target.value); setColorId('') }}>{vehicle.versions.map(v => <option key={v.id} value={v.id}>{v.name} · {v.optionalCode}{v.discount ? ` · ${formatPercent(v.discount.rate)} de desconto` : ''}</option>)}</select></label></div>
        <h2>Chevrolet {vehicle.name}<br />{version.name}</h2>
        <div className={s.infoLinks}><button onClick={() => setPanel('features')}><ClipboardList size={21} />Itens de série<ChevronRight size={16} /></button><button onClick={() => setPanel('technical')}><Settings size={21} />Dados técnicos<ChevronRight size={16} /></button></div>
        <div className={s.carImage}><VehicleImage src={currentImage} alt={exactImage ? `Chevrolet ${vehicle.name}, ${version.name}, ${color.name}` : `Imagem de referência do Chevrolet ${vehicle.name}; pintura selecionada sem imagem específica`} /></div>
        <fieldset className={s.colors}><legend>Escolha a cor</legend><div>{version.colors.map(c => <label key={c.id} className={clsx(s.color, color?.id === c.id && s.colorSelected)}><input type="radio" name="color" aria-label={c.name} checked={color?.id === c.id} onChange={() => setColorId(c.id)} /><span className={s.swatch} style={{ background: c.hex }}>{color?.id === c.id && <Check size={20} />}</span><span>{c.name}</span>{c.paintType && <small>{c.paintType}</small>}<small>{Number(c.additional) === 0 ? 'Sem acréscimo' : `+ ${formatMoney(c.additional)}`}</small></label>)}</div></fieldset>
        {!exactImage && <p className={s.disclaimer}>A foto deste veículo na cor {color?.name} não está disponível. Exibimos uma imagem de referência do modelo. Em caso de dúvida sobre a disponibilidade desta cor, consulte a Ecar.</p>}
      </section></div>
      <aside className={s.summary} aria-label="Sua configuração"><h2>Sua configuração</h2><dl>
        <div><dt>Modelo</dt><dd>{vehicle.name} {vehicle.modelYear}</dd></div><div><dt>Versão</dt><dd>{version.name}</dd></div><div><dt>Código opcional</dt><dd>{code}</dd></div><div><dt>Cor</dt><dd>{color?.name || 'Consulte a Ecar'}</dd></div>
        <div><dt>Preço público nacional</dt><dd>{formatMoney(version.publicPriceNational)}</dd></div><div><dt>Adicional da pintura</dt><dd>{color ? formatMoney(color.additional) : 'Consulte a Ecar'}</dd></div><div><dt>Preço público configurado</dt><dd><output aria-live="polite" data-testid="final-price">{formatMoney(selection.finalPrice)}</output></dd></div>
      {corporate && version.discount && <><div><dt>Desconto ({formatPercent(version.discount.rate)})</dt><dd>− {formatMoney(corporate.discountAmount)}</dd></div><div className="corporate-total"><dt>Preço com desconto</dt><dd><output aria-live="polite" data-testid="corporate-price">{formatMoney(corporate.corporatePrice)}</output></dd></div></>}
      </dl>{version.discount && <p className={s.note}>Desconto aplicado ao preço do veículo e à pintura selecionada. Consulte a Ecar para confirmar as condições comerciais.</p>}<div className={s.corporate}><Tag size={29} /><strong>Consulte as condições<br />para venda corporativa.</strong></div><a className={clsx('button', s.proposal)} href={proposal} target="_blank" rel="noopener noreferrer">Solicitar proposta<ChevronRight /></a><p className={s.reassurance}><WhatsAppIcon size={23} />Atendimento Ecar Frotas pelo WhatsApp.</p><Link className={clsx('text-link', s.back)} to="/veiculos"><ArrowLeft size={19} />Voltar aos veículos</Link></aside>
    </div></div>
    {panel && <Modal title={panel === 'features' ? 'Itens de série' : 'Dados técnicos'} onClose={() => setPanel(null)}>{panel === 'features' ? <p className={s.rawContent}>{version.rawContent || 'Consulte a Ecar'}</p> : <dl>{Object.entries(version.technical).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Consulte a Ecar'}</dd></div>)}</dl>}{version.observations && <p>{version.observations}</p>}</Modal>}
  </div>
}
