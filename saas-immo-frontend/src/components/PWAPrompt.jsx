// Composant : PWAPrompt - Invite à installer l'app et activer les notifications
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton,
  VStack, HStack, Icon, Text, useToast
} from '@chakra-ui/react';
import { FiBell, FiDownload, FiX } from 'react-icons/fi';
import {
  areNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isAppInstalled,
  showLocalNotification
} from '../utils/notifications';

export default function PWAPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const toast = useToast();

  useEffect(() => {
    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Afficher le prompt d'installation si l'app n'est pas déjà installée
      if (!isAppInstalled()) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Attendre 3 secondes avant d'afficher
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifier si on doit afficher le prompt de notifications
    if (areNotificationsSupported() && getNotificationPermission() === 'default') {
      setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 5000); // Attendre 5 secondes
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ App installée');
      toast({
        title: 'Application installée !',
        description: 'ImmoPro est maintenant accessible depuis votre écran d\'accueil.',
        status: 'success',
        duration: 5000
      });
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleNotificationClick = async () => {
    try {
      const granted = await requestNotificationPermission();

      if (granted) {
        toast({
          title: 'Notifications activées !',
          description: 'Vous recevrez maintenant les notifications en temps réel.',
          status: 'success',
          duration: 5000
        });

        // Afficher une notification de test
        showLocalNotification('Bienvenue sur ImmoPro !', {
          body: 'Vous recevrez maintenant toutes les notifications importantes.',
          tag: 'welcome'
        });
      }

      setShowNotificationPrompt(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  return (
    <Box position="fixed" bottom={4} right={4} zIndex={1000} maxW="400px">
      <VStack spacing={3} align="stretch">
        {/* Prompt d'installation */}
        {showInstallPrompt && (
          <Alert
            status="info"
            variant="solid"
            flexDirection="column"
            alignItems="flex-start"
            borderRadius="lg"
            boxShadow="xl"
            bg="purple.600"
          >
            <HStack w="full" justify="space-between" mb={2}>
              <HStack>
                <AlertIcon as={FiDownload} />
                <AlertTitle fontSize="md">Installer l'application</AlertTitle>
              </HStack>
              <CloseButton onClick={() => setShowInstallPrompt(false)} />
            </HStack>

            <AlertDescription fontSize="sm" mb={3}>
              Installez ImmoPro pour un accès rapide et une meilleure expérience !
            </AlertDescription>

            <HStack w="full" spacing={2}>
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                onClick={handleInstallClick}
                flex={1}
              >
                Installer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={() => setShowInstallPrompt(false)}
              >
                Plus tard
              </Button>
            </HStack>
          </Alert>
        )}

        {/* Prompt de notifications */}
        {showNotificationPrompt && (
          <Alert
            status="warning"
            variant="solid"
            flexDirection="column"
            alignItems="flex-start"
            borderRadius="lg"
            boxShadow="xl"
            bg="orange.500"
          >
            <HStack w="full" justify="space-between" mb={2}>
              <HStack>
                <AlertIcon as={FiBell} />
                <AlertTitle fontSize="md">Activer les notifications</AlertTitle>
              </HStack>
              <CloseButton onClick={() => setShowNotificationPrompt(false)} />
            </HStack>

            <AlertDescription fontSize="sm" mb={3}>
              Ne manquez aucune mise à jour : nouveaux biens, rendez-vous, messages...
            </AlertDescription>

            <HStack w="full" spacing={2}>
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                onClick={handleNotificationClick}
                flex={1}
              >
                Activer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={() => setShowNotificationPrompt(false)}
              >
                Plus tard
              </Button>
            </HStack>
          </Alert>
        )}
      </VStack>
    </Box>
  );
}
