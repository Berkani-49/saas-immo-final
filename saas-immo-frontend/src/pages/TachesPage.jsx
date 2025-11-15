// Fichier : src/pages/TachesPage.jsx (Version Propre)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Flex, Alert, AlertIcon, List } from '@chakra-ui/react';
import AddTaskForm from '../AddTaskForm.jsx';
import TaskItem from '../TaskItem.jsx';

export default function TachesPage({ token }) {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const API_URL = 'https://api-immo-final.onrender.com'; 

  useEffect(() => {
    if (!token) return;
    
    const fetchAllData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // On charge les listes UNE PAR UNE (plus stable)
        const tasksRes = await axios.get(`${API_URL}/api/tasks`, config);
        setTasks(tasksRes.data);

        const contactsRes = await axios.get(`${API_URL}/api/contacts`, config);
        setContacts(contactsRes.data);

        const propsRes = await axios.get(`${API_URL}/api/properties`, config);
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

  // Handlers
  const handleTaskAdded = (newTask) => setTasks([newTask, ...tasks]);
  const handleTaskDeleted = (id) => setTasks(tasks.filter(t => t.id !== id));
  const handleTaskUpdated = (updatedTask) => setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));

  const tasksTodoCount = tasks.filter(t => t.status === 'PENDING').length;

  return (
    <Box>
      <Heading mb={6}>Agenda & Tâches</Heading>
      {isLoading ? ( <Flex justify="center"><Spinner size="xl" /></Flex> ) : 
       error ? ( <Alert status="error"><AlertIcon />{error}</Alert> ) : (
        <>
          <AddTaskForm 
            token={token} 
            onTaskAdded={handleTaskAdded} 
            contacts={contacts} 
            properties={properties} 
          />
          <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>
            Tâches à faire ({tasksTodoCount})
          </Heading>
          {tasks.length === 0 ? (
            <Alert status="info" borderRadius="md"><AlertIcon />Aucune tâche.</Alert>
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