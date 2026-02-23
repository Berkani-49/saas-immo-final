// Fichier : src/pages/SubscriptionPage.jsx (Version 3 tiers : Gratuit / Pro / Premium)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Heading, Text, Button, VStack, Icon, Badge, Flex, useToast,
  SimpleGrid, List, ListItem, ListIcon, Divider
} from '@chakra-ui/react';
import { FiCheck, FiX, FiZap, FiArrowRight } from 'react-icons/fi';
import { usePlan } from '../contexts/PlanContext';
import { API_URL } from '../config';

const plans = [
  {
    slug: 'free',
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    description: 'Pour démarrer et tester ImmoFlow',
    color: 'gray',
    borderColor: 'gray.600',
    features: [
      { text: 'Jusqu\'à 3 biens', included: true },
      { text: 'Jusqu\'à 5 contacts', included: true },
      { text: 'Gestion des tâches', included: true },
      { text: 'Rendez-vous', included: true },
      { text: 'RGPD', included: true },
      { text: 'Factures', included: false },
      { text: 'Analytics', included: false },
      { text: 'Équipe', included: false },
      { text: 'Documents PDF', included: false },
      { text: 'IA (Staging & Enhancement)', included: false },
    ]
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: '39',
    period: '/mois',
    description: 'Pour les agents indépendants et petites agences',
    color: 'blue',
    borderColor: 'blue.500',
    badge: 'POPULAIRE',
    features: [
      { text: 'Jusqu\'à 50 biens', included: true },
      { text: 'Jusqu\'à 200 contacts', included: true },
      { text: 'Gestion des tâches', included: true },
      { text: 'Rendez-vous', included: true },
      { text: 'RGPD', included: true },
      { text: 'Factures & Activités', included: true },
      { text: 'Analytics avancés', included: true },
      { text: 'Équipe (3 membres)', included: true },
      { text: 'Documents PDF', included: true },
      { text: 'Notifications', included: true },
      { text: 'IA (Staging & Enhancement)', included: false },
      { text: 'Matching acheteurs', included: false },
    ]
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: '79',
    period: '/mois',
    description: 'Pour les agences qui veulent tout, sans limites',
    color: 'purple',
    borderColor: 'purple.500',
    badge: 'COMPLET',
    features: [
      { text: 'Biens illimités', included: true },
      { text: 'Contacts illimités', included: true },
      { text: 'Gestion des tâches', included: true },
      { text: 'Rendez-vous', included: true },
      { text: 'RGPD', included: true },
      { text: 'Factures & Activités', included: true },
      { text: 'Analytics avancés', included: true },
      { text: 'Équipe illimitée', included: true },
      { text: 'Documents PDF', included: true },
      { text: 'Notifications', included: true },
      { text: 'IA Home Staging virtuel', included: true },
      { text: 'IA Enhancement photo', included: true },
      { text: 'Matching acheteurs IA', included: true },
    ]
  }
];

export default function SubscriptionPage({ token }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const toast = useToast();
  const { plan: currentPlan } = usePlan();

  const handleSubscribe = async (planSlug) => {
    if (planSlug === 'free') return;

    setLoadingPlan(planSlug);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/api/create-checkout-session`, {
        planSlug
      }, config);

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Erreur Paiement:', error);
      toast({ title: 'Erreur', description: 'Impossible de lancer le paiement.', status: 'error' });
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/api/billing/portal`, {}, config);
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le portail de facturation.', status: 'error' });
    }
  };

  return (
    <Box py={10} px={4}>
      <VStack spacing={3} mb={10} textAlign="center">
        <Heading color="gray.800" size="xl">
          Choisissez votre plan
        </Heading>
        <Text fontSize="lg" color="gray.400" maxW="600px">
          Faites évoluer ImmoFlow selon vos besoins. Changez de plan à tout moment.
        </Text>
        {currentPlan !== 'free' && (
          <Button
            variant="link"
            colorScheme="blue"
            onClick={handleManageBilling}
            fontSize="sm"
          >
            Gérer mon abonnement / Portail de facturation
          </Button>
        )}
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} maxW="1100px" mx="auto">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.slug;
          const isPopular = p.badge === 'POPULAIRE';

          return (
            <Box
              key={p.slug}
              bg="white"
              p={8}
              borderRadius="2xl"
              shadow={isPopular ? '0 0 30px rgba(66, 153, 225, 0.15)' : 'xl'}
              borderWidth="2px"
              borderColor={isCurrent ? 'green.500' : p.borderColor}
              position="relative"
              transform={isPopular ? { md: 'scale(1.05)' } : undefined}
              zIndex={isPopular ? 1 : 0}
            >
              {/* Badge plan */}
              {p.badge && (
                <Badge
                  colorScheme={p.color}
                  position="absolute"
                  top="-12px"
                  left="50%"
                  transform="translateX(-50%)"
                  px={4}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  {p.badge}
                </Badge>
              )}

              {/* Badge plan actuel */}
              {isCurrent && (
                <Badge
                  colorScheme="green"
                  position="absolute"
                  top="-12px"
                  right={4}
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  PLAN ACTUEL
                </Badge>
              )}

              {/* Nom du plan */}
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={`${p.color}.400`}
                letterSpacing="wide"
                textTransform="uppercase"
              >
                {p.name}
              </Text>

              {/* Prix */}
              <Flex align="baseline" my={4}>
                <Text fontSize="5xl" fontWeight="extrabold" color="gray.800">
                  {p.price}€
                </Text>
                <Text fontSize="lg" color="gray.500" ml={1}>
                  {p.period}
                </Text>
              </Flex>

              <Text fontSize="sm" color="gray.400" mb={6}>
                {p.description}
              </Text>

              <Divider borderColor="gray.200" mb={6} />

              {/* Features */}
              <List spacing={3} mb={8}>
                {p.features.map((feat, idx) => (
                  <ListItem key={idx} display="flex" alignItems="center">
                    <ListIcon
                      as={feat.included ? FiCheck : FiX}
                      color={feat.included ? 'green.400' : 'gray.600'}
                      boxSize={4}
                    />
                    <Text
                      fontSize="sm"
                      color={feat.included ? 'gray.300' : 'gray.600'}
                    >
                      {feat.text}
                    </Text>
                  </ListItem>
                ))}
              </List>

              {/* Bouton */}
              {isCurrent ? (
                <Button
                  w="full"
                  size="lg"
                  variant="outline"
                  colorScheme="green"
                  isDisabled
                  cursor="default"
                >
                  Plan actuel
                </Button>
              ) : p.slug === 'free' ? (
                <Button
                  w="full"
                  size="lg"
                  variant="outline"
                  colorScheme="gray"
                  isDisabled
                >
                  Plan de base
                </Button>
              ) : (
                <Button
                  w="full"
                  size="lg"
                  colorScheme={p.color}
                  rightIcon={<Icon as={p.slug === 'premium' ? FiZap : FiArrowRight} />}
                  onClick={() => handleSubscribe(p.slug)}
                  isLoading={loadingPlan === p.slug}
                  loadingText="Redirection..."
                >
                  {currentPlan !== 'free' ? 'Changer de plan' : 'S\'abonner'}
                </Button>
              )}
            </Box>
          );
        })}
      </SimpleGrid>

      <Text textAlign="center" fontSize="xs" color="gray.500" mt={8}>
        Paiement sécurisé via Stripe. Annulable à tout moment. TVA non incluse.
      </Text>
    </Box>
  );
}
