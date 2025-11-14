// Fichier : src/theme.js (Nettoyé)
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  // On ne met RIEN dans styles.global pour le body,
  // car index.css s'occupe du fond.
});

export default theme;