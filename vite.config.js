import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // SPA routing: o Vite dev server já serve o index.html para rotas desconhecidas
  // Em produção, configure o host (Vercel/Netlify) para redirecionar para index.html
})
