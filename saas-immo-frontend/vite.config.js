import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // On augmente la limite pour éviter les alertes jaunes inutiles
    chunkSizeWarningLimit: 1600, 
  },
})