// Fichier : src/theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      900: '#0B1120', // Bleu Nuit très foncé (Sidebar)
      800: '#152036', // Bleu Nuit (Survol)
      700: '#1E2D4A',
      600: '#2A3F66',
      500: '#C6A87C', // OR / BEIGE DORÉ (Couleur principale boutons)
      400: '#D4B98F', // Or clair (Survol boutons)
      300: '#E3CQA2',
      100: '#F7F3E8', // Fond très clair teinté or
    },
  },
  fonts: {
    heading: `'Helvetica Neue', sans-serif`,
    body: `'Helvetica Neue', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: '#F7F8FA', // Gris très pâle, presque blanc
        color: '#2D3748', // Texte gris foncé
      },
    },
  },
  components: {
    Button: {
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'blue' ? 'brand.500' : undefined, // Remplace le bleu par l'Or par défaut
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'blue' ? 'brand.400' : undefined,
          },
        }),
      },
    },
  },
});

export default theme;