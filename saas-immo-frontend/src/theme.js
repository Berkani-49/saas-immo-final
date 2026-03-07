// Fichier : src/theme.js (Version SaaS Moderne - Style Linear/Notion)

import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: '#F8FAFC',
        color: 'gray.800',
      },
    },
  },
  colors: {
    // Indigo moderne - style SaaS premium
    brand: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',  // COULEUR PRINCIPALE - indigo
      600: '#4F46E5',  // Hover
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
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
        letterSpacing: 'tight',
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
          borderColor: 'gray.100',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
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
            borderColor: 'gray.200',
            color: 'gray.800',
            borderRadius: 'lg',
            _placeholder: { color: 'gray.400' },
            _hover: { borderColor: 'gray.300' },
            _focus: { borderColor: 'brand.500', bg: 'white', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' },
          }
        }
      }
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'gray.200',
            color: 'gray.800',
            borderRadius: 'lg',
            _hover: { borderColor: 'gray.300' },
          }
        }
      }
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'white',
          borderColor: 'gray.200',
          color: 'gray.800',
          borderRadius: 'lg',
          _placeholder: { color: 'gray.400' },
          _hover: { borderColor: 'gray.300' },
          _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' },
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
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
            color: 'gray.500',
            borderColor: 'gray.100',
            bg: '#F8FAFC',
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: 'wider',
            fontWeight: '600',
          },
          td: {
            borderColor: 'gray.50',
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
              color: 'brand.600',
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
        borderColor: 'gray.100',
      }
    },
  },
});

export default theme;
