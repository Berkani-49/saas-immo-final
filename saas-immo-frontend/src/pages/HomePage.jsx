// Fichier : src/pages/HomePage.jsx (Version Mobile Friendly)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Alert, AlertIcon, SimpleGrid, Text, Icon, Container
} from '@chakra-ui/react';
import { MdHomeWork, MdPerson, MdCheckCircle, MdTrendingUp } from 'react-icons/md';
import StatCard from '../StatCard.jsx';

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
        const response = await axios.get('https://saas-immo.onrender.com/api/stats', config);
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
      
      <Heading mb={8} fontSize={{ base: "2xl", md: "3xl" }} color="gray.700">
        Tableau de Bord
      </Heading>
      
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
      <Heading size="md" mb={5} color="gray.600">Détails de l'activité</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
         
         {/* Bloc Contacts */}
         <Box p={6} shadow="md" borderWidth="1px" borderRadius="2xl" bg="white">
            <Flex align="center" mb={4}>
                <Icon as={MdPerson} color="green.500" mr={2} w={6} h={6} />
                <Heading size="md">Répartition Contacts</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottomWidth={1} py={2}>
                <Text color="gray.600">Acheteurs</Text>
                <Text fontWeight="bold" fontSize="lg">{stats.contacts.buyers}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={2}>
                <Text color="gray.600">Vendeurs</Text>
                <Text fontWeight="bold" fontSize="lg">{stats.contacts.sellers}</Text>
            </Flex>
         </Box>

         {/* Bloc Tâches */}
         <Box p={6} shadow="md" borderWidth="1px" borderRadius="2xl" bg="white">
            <Flex align="center" mb={4}>
                <Icon as={MdCheckCircle} color="purple.500" mr={2} w={6} h={6} />
                <Heading size="md">Suivi des Tâches</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottomWidth={1} py={2}>
                <Text color="gray.600">En attente</Text>
                <Text fontWeight="bold" fontSize="lg" color="red.500">{stats.tasks.pending}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={2}>
                <Text color="gray.600">Terminées</Text>
                <Text fontWeight="bold" fontSize="lg" color="green.500">{stats.tasks.done}</Text>
            </Flex>
         </Box>

      </SimpleGrid>

    </Container>
  );
}