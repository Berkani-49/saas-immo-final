import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Cette ligne remplace "global" par "window" pour que le PDF ne plante pas
    global: 'window',
  },
  build: {
    // Configuration du code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Séparer les librairies vendors en chunks distincts
          if (id.includes('node_modules')) {
            // React et React DOM
            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
            // Chakra UI
            if (id.includes('@chakra-ui') || id.includes('@emotion')) {
              return 'vendor-chakra';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Icones
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            // PDF et canvas
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // Framer Motion (animations)
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
          }
        },
      },
    },
    // Augmenter la limite d'avertissement pour les gros chunks
    chunkSizeWarningLimit: 600,
  },
})
