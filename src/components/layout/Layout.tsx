import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Menu, X, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { whatsappUrl } from '../../config/site'
import { useCatalog } from '../../hooks/useCatalog'
import { WhatsAppIcon } from '../ui/WhatsAppIcon'
import s from './Layout.module.css'
export function Brands() { return <Link to="/inicio" className={s.brands} aria-label="Aurora e Ecar Frotas — Início"><img src="/assets/logos/aurora.png" width="120" height="78" alt="Aurora Alimentos" /><span /><img src="/assets/logos/ecar.png" width="176" height="78" alt="Ecar Frotas" /></Link> }
export function Layout() {
  const { whatsappNumber } = useCatalog()
  const location = useLocation()
  const landing = location.pathname === '/'
  const [open, setOpen] = useState(false)
  return <><a href="#conteudo" className="skip-link">Pular para o conteúdo</a><header className={s.header}><div className={s.inner}><Brands />{!landing && <><button className={s.menuButton} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><nav id="main-navigation" aria-label="Principal" className={clsx(s.nav, open && s.open)} onClick={() => setOpen(false)}><NavLink to="/inicio" end className={({ isActive }) => isActive && !location.hash ? s.active : ''}>Início</NavLink><NavLink to="/veiculos" className={({ isActive }) => isActive ? s.active : ''}>Veículos</NavLink><Link to="/inicio#como-funciona">Como funciona</Link><Link to="/inicio#duvidas">Dúvidas</Link></nav></>}<a className={s.contact} href={whatsappUrl(undefined, whatsappNumber)} target="_blank" rel="noopener noreferrer" aria-label="Atendimento Ecar Frotas pelo WhatsApp (nova aba)"><WhatsAppIcon size={34} /><span>Atendimento Ecar Frotas</span><ChevronRight size={20} /></a></div></header><main id="conteudo" tabIndex={-1}><Outlet /></main>{!landing && <footer className={s.footer}><div className="container"><div className={s.footerTop}><Brands /><nav aria-label="Rodapé"><Link to="/inicio">Início</Link><Link to="/veiculos">Veículos</Link><Link to="/inicio#como-funciona">Como funciona</Link><Link to="/inicio#duvidas">Dúvidas</Link></nav><span>Uma parceria para novos caminhos.</span></div><p>Imagens ilustrativas. Dados conforme a lista pública Chevrolet indicada na configuração. Disponibilidade e condições comerciais podem sofrer alterações e devem ser confirmadas com a Ecar Frotas.</p><small>© {new Date().getFullYear()} Aurora Alimentos + Ecar Frotas</small></div></footer>}</>
}
