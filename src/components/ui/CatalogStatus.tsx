export function CatalogStatus({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (loading) return <div role="status" aria-label="Carregando veículos" className="catalog-skeleton">{[1,2,3,4,5,6].map(i => <div key={i}><span /><span /><span /></div>)}</div>
  if (error) return <div role="alert" className="catalog-error"><h2>Catálogo indisponível</h2><p>{error}</p><button className="button" onClick={retry}>Tentar novamente</button></div>
  return null
}
