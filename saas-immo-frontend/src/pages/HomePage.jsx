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
        color="gray.800"
        letterSpacing="tight"
      >
        Tableau de Bord
      </Heading>

      {/* Onboarding */}
      <OnboardingChecklist stats={stats} />

      {/* GRILLE PRINCIPALE : Cartes KPI */}
      {/* spacing={6} ajoute de l'espace entre les cartes sur mobile */}
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={10}>
        
        <StatCard
          title="Biens en Portefeuille"
          value={stats.properties.total}
          icon={<Icon as={MdHomeWork} w={{ base: 5, md: 8 }} h={{ base: 5, md: 8 }} />}
          colorScheme="blue"
        />
        
        <StatCard
          title="Contacts Totaux"
          value={stats.contacts.total}
          icon={<Icon as={MdPerson} w={{ base: 5, md: 8 }} h={{ base: 5, md: 8 }} />}
          colorScheme="green"
        />
        
        <Box gridColumn={{ base: "span 2", md: "auto" }}>
          <StatCard
            title="Tâches à faire"
            value={stats.tasks.pending}
            icon={<Icon as={MdCheckCircle} w={{ base: 5, md: 8 }} h={{ base: 5, md: 8 }} />}
            colorScheme="purple"
          />
        </Box>
      </SimpleGrid>

      {/* GRILLE SECONDAIRE : Détails */}
      <Heading size="md" mb={5} color="gray.500" letterSpacing="tight" textTransform="uppercase" fontSize="xs" fontWeight="bold">
        Détails de l'activité
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>

         {/* Bloc Contacts */}
         <Box p={6} shadow="xl" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" bg="white" transition="all 0.3s" _hover={{ transform: 'translateY(-2px)', boxShadow: "md" }}>
            <Flex align="center" mb={4}>
                <Icon as={MdPerson} color="green.400" mr={2} w={6} h={6} />
                <Heading size="md" color="gray.800">Répartition Contacts</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottom="1px solid" borderBottomColor="gray.200" py={2}>
                <Text color="gray.600">Acheteurs</Text>
                <Text fontWeight="bold" fontSize="lg" color="gray.800">{stats.contacts.buyers}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={2}>
                <Text color="gray.600">Vendeurs</Text>
                <Text fontWeight="bold" fontSize="lg" color="gray.800">{stats.contacts.sellers}</Text>
            </Flex>
         </Box>

         {/* Bloc Tâches */}
         <Box p={6} shadow="xl" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" bg="white" transition="all 0.3s" _hover={{ transform: 'translateY(-2px)', boxShadow: "md" }}>
            <Flex align="center" mb={4}>
                <Icon as={MdCheckCircle} color="purple.400" mr={2} w={6} h={6} />
                <Heading size="md" color="gray.800">Suivi des Tâches</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottom="1px solid" borderBottomColor="gray.200" py={2}>
                <Text color="gray.600">En attente</Text>
                <Text fontWeight="bold" fontSize="lg" color="red.400">{stats.tasks.pending}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={2}>
                <Text color="gray.600">Terminées</Text>
                <Text fontWeight="bold" fontSize="lg" color="green.400">{stats.tasks.done}</Text>
            </Flex>
         </Box>

      </SimpleGrid>

    </Container>
  );
}