// Fichier : src/TaskItem.jsx (Design Pro & Aéré)

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Checkbox, Text, IconButton, Flex, Badge, Tooltip, HStack, VStack
} from '@chakra-ui/react';
import { DeleteIcon, PhoneIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

export default function TaskItem({ task, token, onTaskUpdated, onTaskDeleted }) {
  const [isLoading, setIsLoading] = useState(false);

  // Gérer le cochage/décochage
  const handleToggleStatus = async (e) => {
    const newStatus = e.target.checked ? 'DONE' : 'PENDING';
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://saas-immo.onrender.com/api/tasks/${task.id}`, {
        title: task.title,
        status: newStatus
      }, config);
      onTaskUpdated(response.data);
    } catch (error) {
      console.error("Erreur", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la suppression
  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://saas-immo.onrender.com/api/tasks/${task.id}`, config);
      onTaskDeleted(task.id);
    } catch (error) {
      console.error("Erreur", error);
      setIsLoading(false);
    }
  };

  const isDone = task.status === 'DONE';
  // Format date plus joli (ex: "22 nov.")
  const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;

  return (
    <Box 
      p={4} mb={3} 
      borderWidth="1px" borderRadius="lg" 
      bg={isDone ? "gray.50" : "white"}
      borderColor={isDone ? "gray.200" : "gray.200"}
      opacity={isDone ? 0.6 : 1}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: "md", borderColor: "blue.200" }}
    >
      <Flex alignItems="flex-start"> {/* Alignement en HAUT pour gérer les textes longs */}
        
        {/* 1. Checkbox (fixe en haut à gauche) */}
        <Checkbox 
          isChecked={isDone} 
          onChange={handleToggleStatus} 
          size="lg" 
          colorScheme="green" 
          mt={1} mr={4}
          isDisabled={isLoading}
        />
        
        {/* 2. Contenu Central (Titre + Badges) */}
        <VStack align="start" flex="1" spacing={2}>
          
          {/* Titre de la tâche */}
          <Text 
            as={isDone ? "s" : "b"} 
            fontSize="md" 
            color={isDone ? "gray.500" : "gray.800"}
            lineHeight="short"
          >
            {task.title}
          </Text>
          
          {/* Ligne des infos (Date, Contact, Bien) */}
          <Flex wrap="wrap" gap={2} alignItems="center">
            
            {/* Date */}
            {dateStr && (
              <Badge colorScheme={isDone ? "gray" : "purple"} variant="subtle" px={2} py={1} borderRadius="full">
                📅 {dateStr}
              </Badge>
            )}
            
            {/* Contact + Bouton Appel */}
            {task.contact && (
              <HStack spacing={0} borderWidth="1px" borderRadius="full" overflow="hidden">
                <Link to={`/contact/${task.contact.id}`}>
                  <Box px={3} py={1} bg="blue.50" _hover={{ bg: "blue.100" }} cursor="pointer">
                    <Text fontSize="xs" fontWeight="bold" color="blue.700">
                      👤 {task.contact.firstName} {task.contact.lastName}
                    </Text>
                  </Box>
                </Link>
                
                {/* Bouton Appel collé au badge */}
                {task.contact.phoneNumber && (
                  <Tooltip label={task.contact.phoneNumber}>
                    <Box 
                      as="a" href={`tel:${task.contact.phoneNumber}`}
                      px={2} py={1} bg="green.100" color="green.700" 
                      _hover={{ bg: "green.200" }} display="flex" alignItems="center"
                      borderLeftWidth="1px" borderColor="white"
                    >
                      <PhoneIcon w={3} h={3} />
                    </Box>
                  </Tooltip>
                )}
              </HStack>
            )}

            {/* Bien Immobilier */}
            {task.property && (
               <Link to={`/property/${task.property.id}`}>
                <Badge colorScheme="orange" variant="outline" px={2} py={1} borderRadius="full" cursor="pointer" _hover={{ bg: "orange.50" }}>
                  🏠 {task.property.address}
                </Badge>
               </Link>
            )}
          </Flex>
        </VStack>

        {/* 3. Bouton Supprimer (fixe en haut à droite) */}
        <IconButton 
          icon={<DeleteIcon />} 
          size="sm" 
          variant="ghost" 
          colorScheme="red" 
          _hover={{ color: "red.500", bg: "red.50" }}
          onClick={handleDelete}
          isLoading={isLoading}
          aria-label="Supprimer"
          ml={2}
        />
      </Flex>
    </Box>
  );
}