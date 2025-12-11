// Composant : StagingModal - Home Staging Virtuel avec sélection de style
import React, { useState } from 'react';
import axios from 'axios';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, Button, VStack, HStack, Text, useToast, Icon, Box, Image,
  SimpleGrid, Badge, Spinner
} from '@chakra-ui/react';
import { FiHome, FiCheck } from 'react-icons/fi';

export default function StagingModal({ isOpen, onClose, property, token, onPropertyUpdated }) {
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [isStaging, setIsStaging] = useState(false);
  const toast = useToast();

  // Styles disponibles avec descriptions et emojis
  const stagingStyles = [
    {
      id: 'modern',
      name: 'Moderne',
      emoji: '🏠',
      description: 'Minimaliste, lignes épurées, contemporain',
      color: 'blue'
    },
    {
      id: 'scandinavian',
      name: 'Scandinave',
      emoji: '🌿',
      description: 'Bois clair, hygge, lumineux et cosy',
      color: 'teal'
    },
    {
      id: 'industrial',
      name: 'Industriel',
      emoji: '🏭',
      description: 'Briques apparentes, métal, style urbain',
      color: 'orange'
    },
    {
      id: 'classic',
      name: 'Classique',
      emoji: '👑',
      description: 'Élégant, traditionnel, luxueux',
      color: 'purple'
    },
    {
      id: 'bohemian',
      name: 'Bohème',
      emoji: '🎨',
      description: 'Coloré, éclectique, artistique',
      color: 'pink'
    }
  ];

  const handleStage = async () => {
    if (!property) return;

    setIsStaging(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      // 1. Démarrer la génération (retourne immédiatement)
      const response = await axios.post(
        `https://saas-immo.onrender.com/api/properties/${property.id}/stage-photo`,
        { style: selectedStyle },
        config
      );

      const predictionId = response.data.predictionId;

      toast({
        title: "⏳ Génération lancée !",
        description: "Cela prendra 60-90 secondes. Veuillez patienter...",
        status: "info",
        duration: 3000,
        isClosable: true
      });

      // 2. Polling toutes les 3 secondes pour vérifier le statut
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(
            `https://saas-immo.onrender.com/api/properties/${property.id}/stage-status/${predictionId}?style=${selectedStyle}`,
            config
          );

          console.log(`🔄 Statut: ${statusResponse.data.status}`);

          if (statusResponse.data.status === 'succeeded') {
            clearInterval(pollInterval);
            setIsStaging(false);

            // Mettre à jour le bien avec la photo meublée
            onPropertyUpdated({
              ...property,
              imageUrlStaged: statusResponse.data.stagedUrl,
              stagingStyle: selectedStyle
            });

            toast({
              title: "🛋️ Home staging réussi !",
              description: statusResponse.data.message,
              status: "success",
              duration: 5000,
              isClosable: true
            });

            onClose();
          } else if (statusResponse.data.status === 'failed') {
            clearInterval(pollInterval);
            setIsStaging(false);

            toast({
              title: "❌ Échec",
              description: statusResponse.data.error || "La génération a échoué.",
              status: "error",
              duration: 5000
            });
          }
          // Sinon, on continue le polling (starting, processing)
        } catch (pollError) {
          console.error("Erreur polling:", pollError);
          clearInterval(pollInterval);
          setIsStaging(false);
          toast({
            title: "Erreur",
            description: "Impossible de vérifier le statut.",
            status: "error"
          });
        }
      }, 3000); // Vérifier toutes les 3 secondes

      // Timeout de sécurité après 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isStaging) {
          setIsStaging(false);
          toast({
            title: "⏱️ Timeout",
            description: "La génération prend plus de temps que prévu. Réessayez plus tard.",
            status: "warning"
          });
        }
      }, 120000); // 2 minutes max

    } catch (error) {
      console.error("Erreur home staging:", error);
      toast({
        title: "Erreur",
        description: error.response?.data?.details || "Impossible de démarrer la génération.",
        status: "error",
        duration: 5000
      });
      setIsStaging(false);
    }
  };

  if (!property) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiHome} color="purple.500" />
            <Text>🛋️ Home Staging Virtuel</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Bien : <strong>{property.address}</strong>
            </Text>

            <Box bg="purple.50" p={4} borderRadius="md">
              <Text fontSize="sm" fontWeight="bold" color="purple.700" mb={2}>
                💡 Qu'est-ce que le Home Staging Virtuel ?
              </Text>
              <Text fontSize="xs" color="gray.700">
                L'IA va meubler votre pièce vide avec le style de votre choix.
                Parfait pour aider les clients à se projeter !
              </Text>
            </Box>

            <Text fontWeight="bold" fontSize="md" color="purple.600">
              Choisissez un style de décoration :
            </Text>

            <SimpleGrid columns={2} spacing={3}>
              {stagingStyles.map((style) => (
                <Box
                  key={style.id}
                  p={4}
                  borderWidth="2px"
                  borderRadius="lg"
                  borderColor={selectedStyle === style.id ? `${style.color}.500` : 'gray.200'}
                  bg={selectedStyle === style.id ? `${style.color}.50` : 'white'}
                  cursor="pointer"
                  onClick={() => setSelectedStyle(style.id)}
                  transition="all 0.2s"
                  _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                  position="relative"
                >
                  {selectedStyle === style.id && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme={style.color}
                    >
                      <Icon as={FiCheck} />
                    </Badge>
                  )}
                  <VStack spacing={2}>
                    <Text fontSize="3xl">{style.emoji}</Text>
                    <Text fontWeight="bold" fontSize="md">{style.name}</Text>
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      {style.description}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>

            {property.imageUrl && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                  Photo actuelle :
                </Text>
                <Image
                  src={property.imageUrl}
                  alt="Photo originale"
                  borderRadius="md"
                  maxH="200px"
                  objectFit="cover"
                  w="100%"
                />
              </Box>
            )}

            <Box bg="yellow.50" p={3} borderRadius="md" borderWidth="1px" borderColor="yellow.200">
              <Text fontSize="xs" color="yellow.800">
                ⚠️ <strong>Note:</strong> Le home staging virtuel coûte environ 0.06$ par génération via l'API Replicate.
                Le traitement peut prendre 60-90 secondes.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleStage}
            isLoading={isStaging}
            loadingText="Meublage en cours..."
            leftIcon={isStaging ? <Spinner size="sm" /> : <Icon as={FiHome} />}
          >
            Meubler la pièce
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
