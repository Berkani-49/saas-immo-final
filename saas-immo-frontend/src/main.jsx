// Fichier : src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme.js';
import { registerServiceWorker } from './utils/notifications';

// Enregistrer le service worker pour la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker()
      .then(() => {
        console.log('✅ PWA prête !');
      })
      .catch((error) => {
        console.error('❌ Erreur PWA:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </BrowserRouter>
);