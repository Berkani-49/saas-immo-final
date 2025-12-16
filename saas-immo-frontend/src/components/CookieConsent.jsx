// Fichier : src/components/CookieConsent.jsx
// Bannière RGPD pour le consentement des cookies

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Switch,
  FormControl,
  FormLabel,
  useDisclosure
} from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Préférences de cookies (par défaut : essentiels uniquement)
  const [preferences, setPreferences] = useState({
    essential: true, // Toujours activés (non modifiable)
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Afficher la bannière après 1 seconde
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Charger les préférences sauvegardées
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      applyCookiePreferences(savedPreferences);
    }
  }, []);

  const applyCookiePreferences = (prefs) => {
    // Appliquer les préférences de cookies
    if (prefs.analytics) {
      // Activer Google Analytics ou autres outils d'analyse
      console.log('Analytics cookies enabled');
    }
    if (prefs.marketing) {
      // Activer les cookies marketing
      console.log('Marketing cookies enabled');
    }
    if (prefs.preferences) {
      // Activer les cookies de préférences
      console.log('Preference cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    applyCookiePreferences(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    setPreferences(onlyEssential);
    localStorage.setItem('cookieConsent', JSON.stringify(onlyEssential));
    applyCookiePreferences(onlyEssential);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    applyCookiePreferences(preferences);
    setShowBanner(false);
    onClose();
  };

  const handleOpenSettings = () => {
    onOpen();
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Bannière de consentement */}
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="white"
        borderTop="3px solid"
        borderTopColor="brand.500"
        boxShadow="0 -4px 20px rgba(0,0,0,0.15)"
        zIndex="9999"
        p={{ base: 4, md: 6 }}
      >
        <Flex
          maxW="1200px"
          mx="auto"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
        >
          <VStack align="start" flex="1" spacing={2}>
            <Text fontWeight="bold" fontSize="lg">
              🍪 Nous utilisons des cookies
            </Text>
            <Text fontSize="sm" color="gray.600">
              Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic et personnaliser le contenu.
              Vous pouvez accepter tous les cookies ou gérer vos préférences.
            </Text>
          </VStack>

          <HStack spacing={3} flexShrink={0}>
            <Button
              variant="ghost"
              size={{ base: 'sm', md: 'md' }}
              onClick={handleOpenSettings}
              leftIcon={<FiSettings />}
            >
              Paramètres
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              size={{ base: 'sm', md: 'md' }}
              onClick={handleRejectAll}
            >
              Refuser
            </Button>
            <Button
              colorScheme="brand"
              size={{ base: 'sm', md: 'md' }}
              onClick={handleAcceptAll}
            >
              Tout accepter
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Modal de paramètres détaillés */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Paramètres des cookies</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Nous utilisons différents types de cookies pour améliorer votre expérience.
                Vous pouvez choisir quels cookies vous souhaitez autoriser.
              </Text>

              {/* Cookies essentiels */}
              <FormControl>
                <Flex justify="space-between" align="center">
                  <Box flex="1" mr={4}>
                    <FormLabel mb={1} fontWeight="bold">
                      Cookies essentiels
                    </FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Nécessaires au fonctionnement du site (authentification, sécurité).
                      Ces cookies ne peuvent pas être désactivés.
                    </Text>
                  </Box>
                  <Switch isChecked={true} isDisabled colorScheme="brand" />
                </Flex>
              </FormControl>

              {/* Cookies d'analyse */}
              <FormControl>
                <Flex justify="space-between" align="center">
                  <Box flex="1" mr={4}>
                    <FormLabel mb={1} fontWeight="bold">
                      Cookies d'analyse
                    </FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Nous permettent de comprendre comment vous utilisez notre site et d'améliorer nos services.
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    colorScheme="brand"
                  />
                </Flex>
              </FormControl>

              {/* Cookies marketing */}
              <FormControl>
                <Flex justify="space-between" align="center">
                  <Box flex="1" mr={4}>
                    <FormLabel mb={1} fontWeight="bold">
                      Cookies marketing
                    </FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Utilisés pour vous proposer des publicités pertinentes et mesurer l'efficacité de nos campagnes.
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    colorScheme="brand"
                  />
                </Flex>
              </FormControl>

              {/* Cookies de préférences */}
              <FormControl>
                <Flex justify="space-between" align="center">
                  <Box flex="1" mr={4}>
                    <FormLabel mb={1} fontWeight="bold">
                      Cookies de préférences
                    </FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Permettent de mémoriser vos choix (langue, thème) pour personnaliser votre expérience.
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.preferences}
                    onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                    colorScheme="brand"
                  />
                </Flex>
              </FormControl>

              <HStack spacing={3} pt={4}>
                <Button flex="1" variant="outline" onClick={handleRejectAll}>
                  Refuser tout
                </Button>
                <Button flex="1" colorScheme="brand" onClick={handleSavePreferences}>
                  Enregistrer mes choix
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
