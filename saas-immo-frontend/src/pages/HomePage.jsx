// Fichier : src/pages/HomePage.jsx (Version Graphique & Finance)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Alert, AlertIcon, SimpleGrid, Text, Icon, Container, Stat, StatLabel, StatNumber, StatHelpText
} from '@chakra-ui/react';
import { MdHomeWork, MdPerson, MdCheckCircle, MdEuroSymbol } from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

  // Données pour le camembert (Clients)
  const pieData = [
    { name: 'Acheteurs', value: stats.contacts.buyers, color: '#3182CE' }, // Bleu
    { name: 'Vendeurs', value: stats.contacts.sellers, color: '#38A169' }, // Vert
  ];

  // Données pour l'histogramme (Performance financière fictive pour la démo, à relier aux factures plus tard)
  const barData = [
    { name: 'Portefeuille', montant: stats.properties.value },
    { name: 'CA Réalisé', montant: stats.finance.revenue }
  ];

  return (
    <Container maxW="container.xl" p={0}>
      <Heading mb={2} fontSize="3xl" color="gray.800">Tableau de Bord</Heading>
      <Text color="gray.500" mb={8}>Vue d'ensemble de votre activité immobilière</Text>
      
      {/* 1. CHIFFRES CLÉS (KPI) */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={10}>
        
        <StatCard title="Biens en mandat" value={stats.properties.total} icon={MdHomeWork} color="blue" />
        
        <StatCard title="Valeur Portefeuille" value={`${(stats.properties.value / 1000000).toFixed(1)} M€`} icon={MdEuroSymbol} color="orange" helpText="Total prix de vente" />
        
        <StatCard title="Contacts Actifs" value={stats.contacts.total} icon={MdPerson} color="green" />
        
        <StatCard title="Tâches Urgent" value={stats.tasks.pending} icon={MdCheckCircle} color="purple" />

      </SimpleGrid>

      {/* 2. GRAPHIQUES */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
         
         {/* Camembert Clients */}
         <Box p={6} shadow="lg" borderWidth="1px" borderRadius="2xl" bg="white" h="400px">
            <Heading size="md" mb={4}>Répartition Clients</Heading>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Flex justify="center" gap={6} mt={-10}>
                <Flex align="center"><Box w={3} h={3} bg="#3182CE" borderRadius="full" mr={2}/> Acheteurs ({stats.contacts.buyers})</Flex>
                <Flex align="center"><Box w={3} h={3} bg="#38A169" borderRadius="full" mr={2}/> Vendeurs ({stats.contacts.sellers})</Flex>
            </Flex>
         </Box>

         {/* Barres Financières */}
         <Box p={6} shadow="lg" borderWidth="1px" borderRadius="2xl" bg="white" h="400px">
            <Heading size="md" mb={4}>Performance Financière</Heading>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip formatter={(val) => `${val.toLocaleString()} €`} />
                    <Bar dataKey="montant" fill="#C6A87C" radius={[10, 10, 0, 0]} barSize={50} />
                </BarChart>
            </ResponsiveContainer>
         </Box>

      </SimpleGrid>
    </Container>
  );
}

// Petit composant carte interne pour simplifier
function StatCard({ title, value, icon, color, helpText }) {
    return (
        <Stat px={5} py={4} shadow="md" border="1px solid" borderColor="gray.100" borderRadius="xl" bg="white">
            <Flex justify="space-between" align="start">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold">{title}</StatLabel>
                    <StatNumber fontSize="3xl" fontWeight="extrabold" color="gray.800">{value}</StatNumber>
                    {helpText && <StatHelpText fontSize="xs">{helpText}</StatHelpText>}
                </Box>
                <Flex align="center" justify="center" w={10} h={10} bg={`${color}.100`} color={`${color}.600`} borderRadius="lg">
                    <Icon as={icon} fontSize="xl" />
                </Flex>
            </Flex>
        </Stat>
    );
}