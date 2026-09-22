import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'private-source-documents',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname: string
        try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname) } catch { response.statusCode = 400; response.end(); return }
        if (/^\/(data|server|prisma|scripts|\.local)(\/|$)/.test(pathname)) { response.statusCode = 404; response.end(); return }
        next()
      })
    },
  }],
  server: {
    proxy: { '/api': 'http://127.0.0.1:3001' },
    fs: { deny: ['**/.env*', '**/.git/**', '**/.local/**', '**/data/**', '**/prisma/**', '**/server/**', '**/scripts/**', '**/*.{pdf,xlsx}'] },
  },
})
