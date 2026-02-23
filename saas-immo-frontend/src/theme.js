// Fichier : src/theme.js (Version Light Mode - Style Agence Immobilière)

import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  colors: {
    // Bleu navy professionnel - style agence immobilière
    brand: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#1D4ED8',  // COULEUR PRINCIPALE - bleu navy
      600: '#1E40AF',  // Hover
      700: '#1E3A8A',
      800: '#1E3060',
      900: '#172554',
    },
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#1D4ED8',
      600: '#1E40AF',
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
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
        color: 'gray.800',
      }
    },
    Text: {
      baseStyle: {
        color: 'gray.700',
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderColor: 'gray.200',
          boxShadow: 'sm',
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
            bg: 'white',
            borderColor: 'gray.300',
            color: 'gray.800',
            _placeholder: { color: 'gray.400' },
            _hover: { borderColor: 'gray.400' },
            _focus: { borderColor: 'brand.500', bg: 'white' },
          }
        }
      }
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'gray.300',
            color: 'gray.800',
            _hover: { borderColor: 'gray.400' },
          }
        }
      }
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'white',
          borderColor: 'gray.300',
          color: 'gray.800',
          _placeholder: { color: 'gray.400' },
          _hover: { borderColor: 'gray.400' },
          _focus: { borderColor: 'brand.500' },
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'white',
        },
        header: {
          color: 'gray.800',
        },
        body: {
          color: 'gray.700',
        }
      }
    },
    Table: {
      variants: {
        simple: {
          th: {
            color: 'gray.600',
            borderColor: 'gray.200',
            bg: 'gray.50',
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: 'wider',
          },
          td: {
            borderColor: 'gray.100',
            color: 'gray.700',
          }
        }
      }
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            color: 'gray.500',
            _selected: {
              color: 'brand.500',
              bg: 'white',
              borderColor: 'gray.200',
            }
          },
          tabpanel: {
            bg: 'white',
          }
        }
      }
    },
    Divider: {
      baseStyle: {
        borderColor: 'gray.200',
      }
    },
  },
});

export default theme;
