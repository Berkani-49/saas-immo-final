// Fichier : src/TaskItem.jsx (Version avec Bouton Appel)

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Checkbox, Text, IconButton, Flex, Badge, Spacer, useToast, Tooltip, HStack
} from '@chakra-ui/react';
import { DeleteIcon, PhoneIcon } from '@chakra-ui/icons'; // <-- J'ai ajouté PhoneIcon
import { Link } from 'react-router-dom';

export default function TaskItem({ task, token, onTaskUpdated, onTaskDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Gérer le cochage/décochage
  const handleToggleStatus = async (e) => {
    const newStatus = e.target.checked ? 'DONE' : 'PENDING';
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://api-immo-final.onrender.com/api/tasks/${task.id}`, {
        title: task.title,
        status: newStatus
      }, config);
      onTaskUpdated(response.data);
    } catch (error) {
      console.error("Erreur update task:", error);
      toast({ status: 'error', title: "Impossible de modifier la tâche." });
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
      await axios.delete(`https://api-immo-final.onrender.com/api/tasks/${task.id}`, config);
      onTaskDeleted(task.id);
      toast({ status: 'success', title: "Tâche supprimée." });
    } catch (error) {
      console.error("Erreur delete task:", error);
      toast({ status: 'error', title: "Impossible de supprimer." });
      setIsLoading(false);
    }
  };

  const isDone = task.status === 'DONE';
  const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;

  return (
    <Box 
      p={3} mb={2} borderWidth={1} borderRadius="md" bg={isDone ? "gray.50" : "white"}
      borderColor={isDone ? "gray.200" : "gray.300"}
      opacity={isDone ? 0.7 : 1}
      _hover={{ boxShadow: "sm" }}
    >
      <Flex alignItems="center" wrap="wrap" gap={2}>
        <Checkbox 
          isChecked={isDone} 
          onChange={handleToggleStatus} 
          size="lg" 
          colorScheme="green" 
          isDisabled={isLoading}
        />
        
        <Box flex="1">
          <Text as={isDone ? "s" : "b"} fontSize="md" display="block">
            {task.title}
          </Text>
          
          <Flex mt={1} gap={2} fontSize="xs" color="gray.500" alignItems="center" wrap="wrap">
            {dateStr && <Badge colorScheme="purple" variant="subtle">📅 {dateStr}</Badge>}
            
            {/* --- ZONE CONTACT & APPEL --- */}
            {task.contact && (
              <HStack spacing={1}>
                {/* Lien vers le profil */}
                <Link to={`/contact/${task.contact.id}`}>
                  <Badge colorScheme="blue" cursor="pointer" _hover={{ bg: "blue.200" }}>
                    👤 {task.contact.firstName} {task.contact.lastName}
                  </Badge>
                </Link>

                {/* BOUTON APPELER (S'affiche seulement s'il y a un numéro) */}
                {task.contact.phoneNumber && (
                  <Tooltip label={`Appeler : ${task.contact.phoneNumber}`} hasArrow>
                    <IconButton
                      as="a" 
                      href={`tel:${task.contact.phoneNumber}`} // La magie est ici
                      icon={<PhoneIcon />}
                      size="xs"
                      colorScheme="green"
                      variant="solid"
                      aria-label="Appeler"
                      isRound
                    />
                  </Tooltip>
                )}
              </HStack>
            )}

            {/* Lien vers Bien */}
            {task.property && (
               <Link to={`/property/${task.property.id}`}>
                <Badge colorScheme="orange" cursor="pointer" _hover={{ bg: "orange.200" }}>
                  🏠 {task.property.address}
                </Badge>
               </Link>
            )}
          </Flex>
        </Box>

        <IconButton 
          icon={<DeleteIcon />} 
          size="sm" 
          variant="ghost" 
          colorScheme="red" 
          onClick={handleDelete}
          isLoading={isLoading}
          aria-label="Supprimer la tâche"
        />
      </Flex>
    </Box>
  );
}