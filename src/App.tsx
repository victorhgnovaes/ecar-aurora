import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/LandingPage/LandingPage'
import { HomePage } from './pages/HomePage/HomePage'
import { VehiclesPage } from './pages/VehiclesPage/VehiclesPage'
import { VehicleConfiguratorPage } from './pages/VehicleConfiguratorPage/VehicleConfiguratorPage'
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage'
import { CatalogProvider } from './components/layout/CatalogProvider'
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView(); else window.scrollTo(0, 0) }, [pathname, hash])
  return null
}
export default function App() {
  return <BrowserRouter><CatalogProvider><ScrollManager /><Routes><Route element={<Layout />}><Route index element={<LandingPage />} /><Route path="inicio" element={<HomePage />} /><Route path="veiculos" element={<VehiclesPage />} /><Route path="veiculos/:slug" element={<VehicleConfiguratorPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></CatalogProvider></BrowserRouter>
}
