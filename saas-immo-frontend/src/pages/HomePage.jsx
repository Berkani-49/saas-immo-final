// Fichier : src/pages/HomePage.jsx (Version Mobile Friendly)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Alert, AlertIcon, SimpleGrid, Text, Icon, Container
} from '@chakra-ui/react';
import { MdHomeWork, MdPerson, MdCheckCircle, MdTrendingUp } from 'react-icons/md';
import StatCard from '../StatCard.jsx';
import OnboardingChecklist from '../components/OnboardingChecklist.jsx';
import { API_URL } from '../config';

export default function HomePage({ token }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/api/stats`, config);
        setStats(response.data);
      } catch (err) {
        console.error("Erreur (stats):", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (isLoading) return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" color="blue.500" /></Flex>;
  if (error) return <Alert status="error" borderRadius="md"><AlertIcon />{error}</Alert>;
  if (!stats) return <Text>Aucune statistique.</Text>;

  return (
    <Container maxW="container.xl" p={0}> {/* Container pour centrer sur grand écran */}
      
      <Heading
        mb={8}
        fontSize={{ base: "2xl", md: "3xl" }}
        bgGradient="linear(to-r, white, gray.400)"
        bgClip="text"
        letterSpacing="tight"
      >
        Tableau de Bord
      </Heading>

      {/* Onboarding */}
      <OnboardingChecklist stats={stats} />

      {/* GRILLE PRINCIPALE : Cartes KPI */}
      {/* spacing={6} ajoute de l'espace entre les cartes sur mobile */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
        
        <StatCard
          title="Biens en Portefeuille"
          value={stats.properties.total}
          icon={<Icon as={MdHomeWork} w={8} h={8} />}
          colorScheme="blue"
        />
        
        <StatCard
          title="Contacts Totaux"
          value={stats.contacts.total}
          icon={<Icon as={MdPerson} w={8} h={8} />}
          colorScheme="green"
        />
        
        <StatCard
          title="Tâches à faire"
          value={stats.tasks.pending}
          icon={<Icon as={MdCheckCircle} w={8} h={8} />}
          colorScheme="purple"
        />
      </SimpleGrid>

      {/* GRILLE SECONDAIRE : Détails */}
      <Heading size="md" mb={5} color="gray.500" letterSpacing="tight" textTransform="uppercase" fontSize="xs" fontWeight="bold">
        Détails de l'activité
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>

         {/* Bloc Contacts */}
         <Box p={6} shadow="xl" borderWidth="1px" borderColor="rgba(99,102,241,0.12)" borderRadius="2xl" bg="linear-gradient(135deg, #1a1f2e 0%, #141924 100%)" transition="all 0.3s" _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(99,102,241,0.12)' }}>
            <Flex align="center" mb={4}>
                <Icon as={MdPerson} color="green.400" mr={2} w={6} h={6} />
                <Heading size="md" color="white">Répartition Contacts</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottom="1px solid rgba(99,102,241,0.1)" py={2}>
                <Text color="gray.400">Acheteurs</Text>
                <Text fontWeight="bold" fontSize="lg" color="white">{stats.contacts.buyers}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={2}>
                <Text color="gray.400">Vendeurs</Text>
                <Text fontWeight="bold" fontSize="lg" color="white">{stats.contacts.sellers}</Text>
            </Flex>
         </Box>

         {/* Bloc Tâches */}
         <Box p={6} shadow="xl" borderWidth="1px" borderColor="rgba(99,102,241,0.12)" borderRadius="2xl" bg="linear-gradient(135deg, #1a1f2e 0%, #141924 100%)" transition="all 0.3s" _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(99,102,241,0.12)' }}>
            <Flex align="center" mb={4}>
                <Icon as={MdCheckCircle} color="purple.400" mr={2} w={6} h={6} />
                <Heading size="md" color="white">Suivi des Tâches</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottom="1px solid rgba(99,102,241,0.1)" py={2}>
                <Text color="gray.400">En attente</Text>
                <Text fontWeight="bold" fontSize="lg" color="red.400">{stats.tasks.pending}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={2}>
                <Text color="gray.400">Terminées</Text>
                <Text fontWeight="bold" fontSize="lg" color="green.400">{stats.tasks.done}</Text>
            </Flex>
         </Box>

      </SimpleGrid>

    </Container>
  );
}