// Fichier : src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
  SimpleGrid, // Pour aligner nos cartes
  Text,
  Icon
} from '@chakra-ui/react';
import { MdHomeWork, MdPerson, MdCheckCircle } from 'react-icons/md'; // Jolies icônes
import StatCard from '../StatCard.jsx'; // On importe notre composant

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
        // On appelle la nouvelle route du cerveau
        const response = await axios.get('https://api-immo-final.onrender.com/api/stats', config);
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

  if (isLoading) {
    return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" /></Flex>;
  }

  if (error) {
    return <Alert status="error"><AlertIcon />{error}</Alert>;
  }

  if (!stats) {
    return <Text>Aucune statistique à afficher.</Text>;
  }

  return (
    <Box>
      <Heading mb={6}>Tableau de Bord</Heading>
      
      {/* La grille de statistiques */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {/* Carte Biens */}
        <StatCard
          title="Biens en Portefeuille"
          value={stats.properties.total}
          icon={<Icon as={MdHomeWork} w={10} h={10} />}
        />
        
        {/* Carte Contacts */}
        <StatCard
          title="Contacts Totaux"
          value={stats.contacts.total}
          icon={<Icon as={MdPerson} w={10} h={10} />}
        />
        
        {/* Carte Tâches */}
        <StatCard
          title="Tâches en Attente"
          value={stats.tasks.pending}
          icon={<Icon as={MdCheckCircle} w={10} h={10} />}
        />
      </SimpleGrid>

      {/* On peut ajouter d'autres grilles ici plus tard */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
         <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={3}>Détail Contacts</Heading>
            <Text>Acheteurs: {stats.contacts.buyers}</Text>
            <Text>Vendeurs: {stats.contacts.sellers}</Text>
         </Box>
         <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={3}>Détail Tâches</Heading>
            <Text>En attente: {stats.tasks.pending}</Text>
            <Text>Terminées: {stats.tasks.done}</Text>
         </Box>
      </SimpleGrid>

    </Box>
  );
}