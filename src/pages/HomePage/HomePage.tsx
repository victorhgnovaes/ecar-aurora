import { Link } from 'react-router'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { HowItWorks } from '../../components/vehicles/HowItWorks'
import { Hero } from '../../components/vehicles/Hero'
import { VehicleCard } from '../../components/vehicles/VehicleCard'
import { useCatalog } from '../../hooks/useCatalog'
import { CatalogStatus } from '../../components/ui/CatalogStatus'
import s from './HomePage.module.css'
const questions = [
  ['Quem pode solicitar uma proposta?', 'Colaboradores da Aurora podem solicitar atendimento. A equipe Ecar Frotas confirmará os critérios de elegibilidade da parceria e a documentação necessária.'],
  ['Os valores podem sofrer alterações?', 'Sim. Os preços públicos seguem a lista Chevrolet identificada na configuração. Disponibilidade e condições comerciais serão confirmadas pela Ecar Frotas e podem sofrer alterações.'],
  ['Como receberei o atendimento?', 'Ao solicitar uma proposta, você será direcionado ao WhatsApp da Ecar Frotas com a sua configuração. Basta enviar a mensagem para iniciar o atendimento personalizado.'],
  ['A proposta possui compromisso de compra?', 'Não. A solicitação é sem compromisso. Você poderá conhecer as condições e esclarecer suas dúvidas antes de decidir.'],
]
export function HomePage() { const { vehicles, loading, error, retry } = useCatalog(); const featured = vehicles.filter(v => v.featured); return <><Hero /><section className={s.featured}><div className="container"><div className={s.heading}><h2>Modelos em destaque</h2><Link className="text-link" to="/veiculos">Ver catálogo completo<ChevronRight size={20} /></Link></div>{(loading || error) ? <CatalogStatus loading={loading} error={error} retry={retry} /> : <div className={s.cards}>{featured.map(v => <VehicleCard key={v.id} vehicle={v} compact />)}</div>}</div></section><section id="como-funciona" className={s.how}><div className="container"><span className={s.kicker}>SIMPLES DO INÍCIO AO FIM</span><h2>Seu Chevrolet em três passos</h2><p className="muted">Você escolhe. A Ecar Frotas cuida dos próximos passos.</p><HowItWorks /></div></section><section id="duvidas" className={s.faq}><div className="container"><div><span className={s.kicker}>PODEMOS AJUDAR?</span><h2>Dúvidas frequentes</h2><p className="muted">Tudo o que você precisa saber<br />para dar o próximo passo.</p></div><div className={s.questions}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={20} /></summary><p>{answer}</p></details>)}</div></div></section></> }
