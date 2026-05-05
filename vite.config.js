import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Garante que o dev server trate como SPA (serve index.html para rotas desconhecidas)
  appType: 'spa',
})
