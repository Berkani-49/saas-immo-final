// Fichier : src/theme.js (Version Gold & Prestige)

import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    // On définit notre couleur "brand" (Or / Beige Doré)
    brand: {
      50: '#F9F6F0',
      100: '#EEDDC2',
      200: '#E3CQA2',
      300: '#D8B98E',
      400: '#D4AF37', // Or classique
      500: '#C6A87C', // <--- LA COULEUR PRINCIPALE (Celle du site exemple)
      600: '#A38860', // Pour le survol (hover)
      700: '#806845',
      800: '#5E4B30',
      900: '#0B1120', // Bleu Nuit très foncé (pour le menu)
    },
    // On remplace aussi le bleu par défaut par notre Or, comme ça tout change d'un coup
    blue: {
      50: '#F9F6F0',
      100: '#EEDDC2',
      500: '#C6A87C', // Le bouton "blue" deviendra Or
      600: '#A38860', // Le survol deviendra Or foncé
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'lg',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
      }
    },
  },
});

export default theme;