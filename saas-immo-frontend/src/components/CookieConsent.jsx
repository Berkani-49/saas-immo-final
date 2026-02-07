// Fichier : src/components/TermsConsent.jsx
// Bannière d'acceptation des conditions d'utilisation

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  HStack,
  VStack,
  Link,
  Icon
} from '@chakra-ui/react';
import { FiFileText, FiShield } from 'react-icons/fi';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les conditions
    const accepted = localStorage.getItem('termsAccepted');
    if (!accepted) {
      // Afficher la bannière après 1 seconde
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('termsAccepted', JSON.stringify({
      accepted: true,
      date: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="gray.800"
      borderTop="3px solid"
      borderTopColor="brand.500"
      boxShadow="0 -4px 20px rgba(0,0,0,0.4)"
      zIndex="9999"
      p={{ base: 4, md: 5 }}
    >
      <Flex
        maxW="1200px"
        mx="auto"
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        gap={4}
      >
        <VStack align="start" flex="1" spacing={2}>
          <HStack>
            <Icon as={FiFileText} color="brand.500" />
            <Text fontWeight="bold" fontSize="lg" color="white">
              Conditions d'utilisation
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            En continuant à utiliser ImmoFlow, vous acceptez nos{' '}
            <Link color="brand.500" fontWeight="medium" href="/conditions" isExternal>
              conditions d'utilisation
            </Link>
            {' '}et notre{' '}
            <Link color="brand.500" fontWeight="medium" href="/confidentialite" isExternal>
              politique de confidentialité
            </Link>
            . Vos données sont protégées conformément au RGPD.
          </Text>
        </VStack>

        <HStack spacing={3} flexShrink={0}>
          <HStack spacing={1} color="gray.500" fontSize="xs">
            <Icon as={FiShield} />
            <Text>RGPD</Text>
          </HStack>
          <Button
            colorScheme="brand"
            size={{ base: 'sm', md: 'md' }}
            onClick={handleAccept}
          >
            J'accepte
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
