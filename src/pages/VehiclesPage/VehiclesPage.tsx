import { useState } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { VehicleCard } from '../../components/vehicles/VehicleCard'
import { categories } from '../../data/vehicles'
import { useCatalog } from '../../hooks/useCatalog'
import { CatalogStatus } from '../../components/ui/CatalogStatus'
import s from './VehiclesPage.module.css'
export function VehiclesPage() {
  const { vehicles, loading, error, retry } = useCatalog()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('Todos')
  const [sort, setSort] = useState('featured')
  const normalized = query.trim().toLocaleLowerCase('pt-BR')
  const results = vehicles.filter(v => (category === 'Todos' || v.category === category) && v.name.toLocaleLowerCase('pt-BR').includes(normalized)).sort((a, b) => sort === 'az' ? a.name.localeCompare(b.name, 'pt-BR') : sort === 'za' ? b.name.localeCompare(a.name, 'pt-BR') : a.order - b.order)
  if (loading || error) return <div className="container"><div className="page-heading"><Breadcrumb /><h1>Encontre o <span className="accent">Chevrolet</span> ideal para você</h1></div><CatalogStatus loading={loading} error={error} retry={retry} /></div>
  return <div className={clsx('decorated', s.page)}><div className="container"><div className="page-heading"><Breadcrumb /><h1>Encontre o <span className="accent">Chevrolet</span> ideal para você</h1><p>Compare os modelos disponíveis e escolha o que mais combina com a sua rotina.</p></div><div className={s.toolbar}><label className={s.search}><Search size={22} /><input aria-label="Buscar modelo" placeholder="Buscar modelo" value={query} onChange={e => setQuery(e.target.value)} type="search" /></label><div className={s.filters} role="group" aria-label="Filtrar por categoria">{categories.map(item => <button key={item} className={clsx(s.filter, item === category && s.selected)} aria-pressed={item === category} onClick={() => setCategory(item)}>{item}</button>)}</div><label className={s.sort}>Ordenar por:<select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Destaques</option><option value="az">Nome: A–Z</option><option value="za">Nome: Z–A</option></select></label></div><p className={s.count} role="status">{results.length} {results.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}</p>{results.length > 0 ? <div className={s.grid}>{results.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div> : <div className={s.empty}><Search size={38} /><h2>Nenhum modelo encontrado</h2><p>Tente outro nome ou escolha uma categoria diferente.</p><button className="button" onClick={() => { setQuery(''); setCategory('Todos') }}><RotateCcw size={18} />Limpar filtros</button></div>}</div></div>
}
