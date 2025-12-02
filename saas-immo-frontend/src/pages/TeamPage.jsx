// Fichier : src/pages/TeamPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Spinner, Table, Thead, Tbody, Tr, Th, Td, 
  Avatar, Text, Button, Flex, Badge 
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

export default function TeamPage({ token }) {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://api-immo-final.onrender.com/api/agents', config);
        setAgents(response.data);
      } catch (error) {
        console.error("Erreur", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, [token]);

  if (isLoading) return <Flex justify="center" mt={10}><Spinner size="xl" color="brand.500" /></Flex>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>L'Équipe</Heading>
        
        {/* Le bouton vers la page secrète */}
        <Link to="/nouveau-membre-agence">
            <Button leftIcon={<AddIcon />} colorScheme="brand">
                Nouveau Membre
            </Button>
        </Link>
      </Flex>

      <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" borderWidth="1px">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Agent</Th>
              <Th>Email</Th>
              <Th>Membre depuis</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {agents.map((agent) => (
              <Tr key={agent.id}>
                <Td>
                  <Flex align="center">
                    <Avatar size="sm" name={`${agent.firstName} ${agent.lastName}`} mr={3} bg="brand.500" color="white" />
                    <Text fontWeight="bold">{agent.firstName} {agent.lastName}</Text>
                  </Flex>
                </Td>
                <Td>{agent.email}</Td>
                <Td>{new Date(agent.createdAt).toLocaleDateString()}</Td>
                <Td><Badge colorScheme="green">Actif</Badge></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}