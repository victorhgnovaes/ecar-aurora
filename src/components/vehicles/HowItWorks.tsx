import { ArrowUpRight, Check, MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { whatsappUrl } from '../../config/site'
import { useCatalog } from '../../hooks/useCatalog'
import s from './HowItWorks.module.css'

export function HowItWorks() {
  const { whatsappNumber } = useCatalog()
  return <ol className={s.steps} aria-label="Como escolher seu Chevrolet">
    <li className={s.choose}>
      <div className={s.topline}><span className={s.number}>01</span><span>O primeiro encontro</span></div>
      <div className={s.carScene} aria-hidden="true"><span className={s.road} /><img src="/assets/vehicles/onix.png" alt="" width="420" height="220" loading="lazy" /><span className={s.sceneCaption}>Um novo caminho começa aqui.</span></div>
      <div className={s.content}><h3>Encontre seu Chevrolet</h3><p>Para o trabalho, a família ou a próxima viagem. Compare os modelos e escolha o seu.</p><Link to="/veiculos" className={s.action}>Explorar os modelos<ArrowUpRight size={19} /></Link></div>
    </li>
    <li className={s.customize}>
      <div className={s.topline}><span className={s.number}>02</span><span>Os detalhes são seus</span></div>
      <div className={s.detailsScene} aria-hidden="true"><div className={s.sampleLabel}><span>SEU CHEVROLET</span><span>Do seu jeito.</span></div><div className={s.paintSamples}><span /><span /><span><Check size={19} /></span><span /></div><div className={s.detailLine}><span>Versão</span><span>Pintura</span><span>Pronto.</span></div></div>
      <div className={s.content}><h3>Escolha os detalhes</h3><p>Defina a versão e a cor. Veja o preço e o desconto da sua configuração, sem sair da página.</p><Link to="/veiculos" className={s.action}>Montar minha configuração<ArrowUpRight size={19} /></Link></div>
    </li>
    <li className={s.talk}>
      <div className={s.topline}><span className={s.number}>03</span><span>A gente continua daqui</span></div>
      <div className={s.chatScene} aria-hidden="true"><div className={s.chatHeader}><MessageCircle size={20} /><span>Ecar Frotas</span></div><div className={s.bubble}>Encontrei meu Chevrolet.<br />Vamos conversar?<Check size={14} /></div><span className={s.chatCaption}>Sua configuração já vai na mensagem.</span></div>
      <div className={s.content}><h3>Fale com a Ecar</h3><p>Envie sua escolha pelo WhatsApp. Nossa equipe confere as condições e prepara sua proposta.</p><a href={whatsappUrl(undefined, whatsappNumber)} target="_blank" rel="noopener noreferrer" className={s.action}>Conversar com a equipe<ArrowUpRight size={19} /></a></div>
    </li>
  </ol>
}
