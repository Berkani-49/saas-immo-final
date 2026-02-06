import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Cette ligne remplace "global" par "window" pour que le PDF ne plante pas
    global: 'window',
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
})
