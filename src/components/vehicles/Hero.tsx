import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import s from './Hero.module.css'
export function Hero({ landing = false }: { landing?: boolean }) {
  return <section className={clsx('decorated', s.hero, landing && s.landing)}><div className={clsx('container', s.inner)}><div className={s.copy}><div className="eyebrow">PARCERIA CORPORATIVA</div><h1>{landing ? <>Condições exclusivas{' '}<br />para a <span className="accent">Aurora</span></> : <>Seu próximo{' '}<br /><span className="accent">Chevrolet</span> está aqui</>}</h1><p>{landing ? 'Escolha seu Chevrolet e solicite uma proposta de forma rápida e simples.' : 'Condições exclusivas para colaboradores Aurora, com atendimento personalizado da Ecar Frotas.'}</p><div className={s.actions}><Link className="button" to={landing ? '/inicio' : '/veiculos'}>{landing ? 'Ver veículos' : 'Ver todos os veículos'}<ChevronRight /></Link>{!landing && <Link className="text-link" to="/inicio#como-funciona">Como funciona<ChevronRight size={20} /></Link>}</div></div><div className={s.visual}><img src={landing ? '/assets/vehicles/tracker.png' : '/assets/vehicles/s10-hero.png'} alt={landing ? 'Chevrolet Tracker em destaque' : 'Chevrolet S10 em destaque'} width="900" height="600" fetchPriority="high" /></div></div></section>
}
