// Fichier : src/pages/TachesPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Flex, Alert, AlertIcon, List } from '@chakra-ui/react';

// On réutilise les composants de tâches
import AddTaskForm from '../AddTaskForm.jsx';
import TaskItem from '../TaskItem.jsx';

export default function TachesPage({ token }) {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Chargement de TOUTES les données (Tâches, Contacts, Biens) ---
  useEffect(() => {
    if (!token) return;
    
    const fetchAllData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // On lance les 3 requêtes en parallèle pour gagner du temps
        const [tasksRes, contactsRes, propsRes] = await Promise.all([
          axios.get('https://saas-immo-complet.onrender.com/api/tasks', config),
          axios.get('https://saas-immo-complet.onrender.com/api/contacts', config),
          axios.get('https://saas-immo-complet.onrender.com/api/properties', config)
        ]);

        setTasks(tasksRes.data);
        setContacts(contactsRes.data);
        setProperties(propsRes.data);

      } catch (err) {
        console.error("Erreur (tâches):", err);
        setError("Impossible de charger les données de la page.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  // --- Handlers (Mise à jour de l'interface) ---
  const handleTaskAdded = (newTask) => {
    setTasks([newTask, ...tasks]);
  };
  
  const handleTaskDeleted = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };
  
  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
  };

  // Calcul du nombre de tâches "à faire"
  const tasksTodoCount = tasks.filter(t => t.status === 'PENDING').length;

  return (
    <Box>
      <Heading mb={6}>Agenda & Tâches</Heading>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" /></Flex>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : (
        <>
          {/* Le formulaire (on lui donne les contacts et biens chargés) */}
          <AddTaskForm 
            token={token} 
            onTaskAdded={handleTaskAdded} 
            contacts={contacts} 
            properties={properties} 
          />

          <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>
            Tâches à faire ({tasksTodoCount})
          </Heading>

          {/* Affichage de la liste */}
          {tasks.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Vous n'avez aucune tâche pour le moment.
            </Alert>
          ) : (
            <List spacing={2}>
              {tasks.map(t => (
                <TaskItem 
                  key={t.id} 
                  task={t} 
                  token={token} 
                  onTaskUpdated={handleTaskUpdated} 
                  onTaskDeleted={handleTaskDeleted} 
                />
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );
}