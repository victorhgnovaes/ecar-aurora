import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
export function NotFoundPage() { return <section className="container" style={{ paddingBlock: 100, textAlign: 'center', minHeight: '60vh' }}><p className="eyebrow" style={{ justifyContent: 'center' }}>404 • CAMINHO NÃO ENCONTRADO</p><h1>Vamos encontrar<br />um novo caminho?</h1><p className="muted" style={{ marginBlock: 24 }}>Esta página ou modelo não está disponível.</p><Link className="button" to="/veiculos"><ArrowLeft size={20} />Voltar aos veículos</Link></section> }
