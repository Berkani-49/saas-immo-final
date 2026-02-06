// Fichier : src/theme.js (Version Dark Mode Moderne)

import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'gray.100',
      },
    },
  },
  colors: {
    // Palette moderne bleu/indigo
    brand: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',  // Accent principal pour dark mode
      500: '#6366F1',  // COULEUR PRINCIPALE
      600: '#4F46E5',  // Hover
      700: '#4338CA',
      800: '#3730A3',
      900: '#1E1B4B',
    },
    blue: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      500: '#6366F1',
      600: '#4F46E5',
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
    Heading: {
      baseStyle: {
        color: 'white',
      }
    },
    Text: {
      baseStyle: {
        color: 'gray.300',
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'gray.800',
          borderColor: 'gray.700',
        }
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
      variants: {
        outline: {
          field: {
            bg: 'gray.800',
            borderColor: 'gray.600',
            color: 'white',
            _placeholder: { color: 'gray.400' },
            _hover: { borderColor: 'gray.500' },
            _focus: { borderColor: 'brand.500', bg: 'gray.800' },
          }
        }
      }
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'gray.800',
            borderColor: 'gray.600',
            color: 'white',
            _hover: { borderColor: 'gray.500' },
          }
        }
      }
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'gray.800',
          borderColor: 'gray.600',
          color: 'white',
          _placeholder: { color: 'gray.400' },
          _hover: { borderColor: 'gray.500' },
          _focus: { borderColor: 'brand.500' },
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'gray.800',
        },
        header: {
          color: 'white',
        },
        body: {
          color: 'gray.300',
        }
      }
    },
    Table: {
      variants: {
        simple: {
          th: {
            color: 'gray.400',
            borderColor: 'gray.700',
          },
          td: {
            borderColor: 'gray.700',
            color: 'gray.200',
          }
        }
      }
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            color: 'gray.400',
            _selected: {
              color: 'white',
              bg: 'gray.800',
              borderColor: 'gray.700',
            }
          },
          tabpanel: {
            bg: 'gray.800',
          }
        }
      }
    },
  },
});

export default theme;
