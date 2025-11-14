// Fichier : src/theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      'html, body': {
        backgroundColor: 'gray.50', // Un gris très doux pour le fond d'écran
        color: 'gray.800',          // Un gris très foncé pour le texte (lisible)
        minHeight: '100vh',
      },
    },
  },
});

export default theme;