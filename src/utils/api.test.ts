import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules() })

test('Vercel carrega JSON publicado mesmo com URL de API local configurada', async () => {
  vi.stubEnv('VITE_CATALOG_MODE', 'static')
  vi.stubEnv('VITE_API_URL', 'http://localhost:3001/api')
  const fetcher = vi.fn().mockImplementation(async () => new Response(JSON.stringify([{ slug: 'onix' }]), { headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', fetcher)
  const { get } = await import('./api')
  expect(await get('/vehicles', new AbortController().signal)).toEqual([{ slug: 'onix' }])
  expect(fetcher.mock.calls[0][0]).toBe('/catalog/vehicles.json')
  await get('/vehicles/onix', new AbortController().signal)
  expect(fetcher.mock.calls[1][0]).toBe('/catalog/vehicles/onix.json')
  await get('/catalog/meta', new AbortController().signal)
  expect(fetcher.mock.calls[2][0]).toBe('/catalog/catalog/meta.json')
})

test('modelo ausente não interpreta fallback HTML como catálogo', async () => {
  vi.stubEnv('VITE_CATALOG_MODE', 'static')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html></html>', { headers: { 'content-type': 'text/html' } })))
  const { get } = await import('./api')
  await expect(get('/vehicles/inexistente', new AbortController().signal)).rejects.toMatchObject({ status: 404 })
})

test('modo normal continua usando a API configurada', async () => {
  vi.stubEnv('VITE_CATALOG_MODE', '')
  vi.stubEnv('VITE_API_URL', 'https://api.example.com/api')
  const fetcher = vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetcher)
  const { get } = await import('./api')
  await get('/vehicles', new AbortController().signal)
  expect(fetcher.mock.calls[0][0]).toBe('https://api.example.com/api/vehicles')
})
