import { useState } from 'react'
export function VehicleImage({ src, alt, className, loading }: { src: string; alt: string; className?: string; loading?: 'lazy' | 'eager' }) {
  const [failedSource,setFailedSource] = useState<string | null>(null)
  const failed = failedSource === src
  return <img src={failed ? '/assets/vehicles/unavailable.svg' : src} alt={failed ? 'Imagem do veículo indisponível' : alt} width="900" height="500" loading={loading} className={className} onError={() => setFailedSource(src)} />
}
