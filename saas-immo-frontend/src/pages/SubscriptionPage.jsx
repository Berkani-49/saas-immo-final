// Fichier : src/pages/SubscriptionPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Text, Button, VStack, Icon, Badge, Flex, useToast, SimpleGrid 
} from '@chakra-ui/react';
import { FiCheck, FiStar } from 'react-icons/fi';

export default function SubscriptionPage({ token }) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      // On demande au serveur de créer la session Stripe
      const response = await axios.post('https://saas-immo.onrender.com/api/create-checkout-session', {}, config);
      
      // Le serveur nous renvoie l'URL de paiement Stripe
      if (response.data.url) {
        window.location.href = response.data.url; // Redirection vers Stripe
      }
    } catch (error) {
      console.error("Erreur Paiement:", error);
      toast({ title: "Erreur", description: "Impossible de lancer le paiement.", status: "error" });
      setIsLoading(false);
    }
  };

  return (
    <Box textAlign="center" py={10}>
      <Heading mb={4} color="white">Passez à la vitesse supérieure</Heading>
      <Text fontSize="lg" color="gray.400" mb={10}>
        Débloquez tout le potentiel de ImmoFlow pour votre agence.
      </Text>

      <Flex justify="center">
        <Box
          bg="gray.800" p={8} borderRadius="2xl" shadow="xl" borderWidth="1px" borderColor="brand.500"
          maxW="400px" w="full" position="relative"
        >
          <Badge
            colorScheme="brand" position="absolute" top="-15px" right="50%" transform="translateX(50%)"
            px={4} py={1} borderRadius="full" fontSize="sm" boxShadow="md"
          >
            OFFRE POPULAIRE
          </Badge>

          <Text fontSize="sm" fontWeight="bold" color="gray.400" letterSpacing="wide">PREMIUM</Text>
          <Flex justify="center" align="baseline" my={4}>
            <Text fontSize="5xl" fontWeight="extrabold" color="white">29€</Text>
            <Text fontSize="xl" color="gray.400">/mois</Text>
          </Flex>

          <VStack spacing={4} align="start" mb={8}>
            <Feature text="Biens illimités" />
            <Feature text="Génération PDF Vitrine" />
            <Feature text="Emails automatiques (Leads)" />
            <Feature text="Géolocalisation avancée" />
            <Feature text="Support prioritaire" />
          </VStack>

          <Button 
            size="lg" w="full" colorScheme="brand" height="60px" fontSize="xl"
            rightIcon={<Icon as={FiStar} />}
            onClick={handleSubscribe}
            isLoading={isLoading}
            loadingText="Redirection..."
          >
            S'abonner maintenant
          </Button>
          <Text fontSize="xs" color="gray.400" mt={4}>Paiement sécurisé via Stripe. Annulable à tout moment.</Text>
        </Box>
      </Flex>
    </Box>
  );
}

function Feature({ text }) {
  return (
    <Flex align="center">
      <Icon as={FiCheck} color="green.400" mr={3} />
      <Text color="gray.300">{text}</Text>
    </Flex>
  );
}