// Fichier : src/pages/HomePage.jsx (Version Alignement Parfait)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Alert, AlertIcon, SimpleGrid, Text, Icon, Container
} from '@chakra-ui/react';
import { MdHomeWork, MdPerson, MdCheckCircle } from 'react-icons/md';
import StatCard from '../StatCard.jsx';

export default function HomePage({ token }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://api-immo-final.onrender.com/api/stats', config);
        setStats(response.data);
      } catch (err) { console.error(err); } 
      finally { setIsLoading(false); }
    };
    fetchStats();
  }, [token]);

  if (isLoading) return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" color="brand.500" /></Flex>;
  if (!stats) return <Text>Aucune donnée.</Text>;

  return (
    <Container maxW="container.xl" p={0}>
      <Heading mb={8} fontSize="3xl" color="gray.800">Tableau de Bord</Heading>
      
      {/* GRILLE DU HAUT (Cartes KPI) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={10}>
        <StatCard title="Biens" value={stats.properties.total} icon={<Icon as={MdHomeWork} />} colorScheme="blue" />
        <StatCard title="Contacts" value={stats.contacts.total} icon={<Icon as={MdPerson} />} colorScheme="green" />
        <StatCard title="Tâches" value={stats.tasks.pending} icon={<Icon as={MdCheckCircle} />} colorScheme="purple" />
      </SimpleGrid>

      {/* GRILLE DU BAS (Détails) */}
      <Heading size="md" mb={6} color="gray.600">Activité détaillée</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
         
         {/* Bloc Contacts - Hauteur forcée pour alignement */}
         <Box p={8} shadow="lg" borderWidth="1px" borderRadius="2xl" bg="white" h="100%">
            <Flex align="center" mb={6}>
                <Flex align="center" justify="center" w={10} h={10} bg="green.100" color="green.600" borderRadius="lg" mr={4}>
                    <Icon as={MdPerson} fontSize="xl" />
                </Flex>
                <Heading size="md">Contacts</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottomWidth={1} borderColor="gray.100" py={3}>
                <Text color="gray.500" fontWeight="medium">Acheteurs</Text>
                <Text fontWeight="bold" fontSize="xl">{stats.contacts.buyers}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={3}>
                <Text color="gray.500" fontWeight="medium">Vendeurs</Text>
                <Text fontWeight="bold" fontSize="xl">{stats.contacts.sellers}</Text>
            </Flex>
         </Box>

         {/* Bloc Tâches - Hauteur forcée pour alignement */}
         <Box p={8} shadow="lg" borderWidth="1px" borderRadius="2xl" bg="white" h="100%">
            <Flex align="center" mb={6}>
                <Flex align="center" justify="center" w={10} h={10} bg="purple.100" color="purple.600" borderRadius="lg" mr={4}>
                    <Icon as={MdCheckCircle} fontSize="xl" />
                </Flex>
                <Heading size="md">Tâches</Heading>
            </Flex>
            <Flex justify="space-between" align="center" borderBottomWidth={1} borderColor="gray.100" py={3}>
                <Text color="gray.500" fontWeight="medium">En attente</Text>
                <Text fontWeight="bold" fontSize="xl" color="red.500">{stats.tasks.pending}</Text>
            </Flex>
            <Flex justify="space-between" align="center" py={3}>
                <Text color="gray.500" fontWeight="medium">Terminées</Text>
                <Text fontWeight="bold" fontSize="xl" color="green.500">{stats.tasks.done}</Text>
            </Flex>
         </Box>

      </SimpleGrid>
    </Container>
  );
}