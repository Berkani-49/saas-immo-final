// Fichier : src/TaskItem.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Checkbox, Text, IconButton, Flex, Badge, Spacer, useToast 
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
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
      const response = await axios.put(`https://saas-immo-complet.onrender.com/api/tasks/${task.id}`, {
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
      await axios.delete(`https://saas-immo-complet.onrender.com/api/tasks/${task.id}`, config);
      onTaskDeleted(task.id);
      toast({ status: 'success', title: "Tâche supprimée." });
    } catch (error) {
      console.error("Erreur delete task:", error);
      toast({ status: 'error', title: "Impossible de supprimer." });
      setIsLoading(false);
    }
  };

  const isDone = task.status === 'DONE';

  // Formatage de la date
  const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;

  return (
    <Box 
      p={3} mb={2} borderWidth={1} borderRadius="md" bg={isDone ? "gray.50" : "white"}
      borderColor={isDone ? "gray.200" : "gray.300"}
      opacity={isDone ? 0.7 : 1}
    >
      <Flex alignItems="center">
        <Checkbox 
          isChecked={isDone} 
          onChange={handleToggleStatus} 
          size="lg" 
          colorScheme="green" 
          mr={3}
          isDisabled={isLoading}
        />
        
        <Box>
          <Text as={isDone ? "s" : "b"} fontSize="md">
            {task.title}
          </Text>
          <Flex mt={1} gap={2} fontSize="xs" color="gray.500" alignItems="center" wrap="wrap">
            {dateStr && <Badge colorScheme="purple">📅 {dateStr}</Badge>}
            
            {/* Lien vers Contact */}
            {task.contact && (
              <Link to={`/contact/${task.contact.id}`}>
                <Badge colorScheme="blue" cursor="pointer">👤 {task.contact.firstName} {task.contact.lastName}</Badge>
              </Link>
            )}

            {/* Lien vers Bien */}
            {task.property && (
               <Link to={`/property/${task.property.id}`}>
                <Badge colorScheme="orange" cursor="pointer">🏠 {task.property.address}</Badge>
               </Link>
            )}
          </Flex>
        </Box>

        <Spacer />
        
        <IconButton 
          icon={<DeleteIcon />} 
          size="sm" 
          variant="ghost" 
          colorScheme="red" 
          onClick={handleDelete}
          isLoading={isLoading}
        />
      </Flex>
    </Box>
  );
}