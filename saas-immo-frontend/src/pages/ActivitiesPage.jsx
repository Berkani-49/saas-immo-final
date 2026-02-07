// Fichier : src/pages/ActivitiesPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Flex, Text, VStack, Badge, Icon } from '@chakra-ui/react';
import { FiActivity, FiPlusCircle, FiEdit, FiTrash2, FiCheckCircle, FiUser } from 'react-icons/fi';

export default function ActivitiesPage({ token }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchActivities = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo.onrender.com/api/activities', config);
        setActivities(response.data);
      } catch (error) {
        console.error("Erreur logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, [token]);

  // Petite fonction pour choisir l'icône et la couleur selon l'action
  const getActionStyle = (action) => {
    if (action.includes('CRÉATION') || action.includes('NOUVEAU')) return { color: 'green', icon: FiPlusCircle };
    if (action.includes('MODIF')) return { color: 'blue', icon: FiEdit };
    if (action.includes('SUPPRESSION')) return { color: 'red', icon: FiTrash2 };
    if (action.includes('TERMINÉE')) return { color: 'purple', icon: FiCheckCircle };
    return { color: 'gray', icon: FiActivity };
  };

  return (
    <Box>
      <Heading mb={6} color="white">Journal d'Activité</Heading>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" /></Flex>
      ) : activities.length === 0 ? (
        <Text>Aucune activité récente.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {activities.map((log) => {
            const style = getActionStyle(log.action);
            const date = new Date(log.createdAt).toLocaleString('fr-FR');
            
            return (
              <Box key={log.id} p={4} bg="gray.800" shadow="sm" borderRadius="lg" borderWidth="1px" borderLeftWidth="5px" borderLeftColor={`${style.color}.400`}>
                <Flex align="center">
                  <Icon as={style.icon} color={`${style.color}.500`} w={6} h={6} mr={4} />
                  
                  <Box flex="1">
                    <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="bold" fontSize="md" color="white">{log.description}</Text>
                        <Text fontSize="xs" color="gray.400">{date}</Text>
                    </Flex>
                    
                    <Flex align="center" gap={3}>
                        <Badge colorScheme={style.color} variant="subtle">{log.action}</Badge>
                        <Flex align="center" color="gray.500" fontSize="sm">
                            <Icon as={FiUser} mr={1} />
                            {log.agent ? `${log.agent.firstName} ${log.agent.lastName}` : 'Système'}
                        </Flex>
                    </Flex>
                  </Box>
                </Flex>
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}