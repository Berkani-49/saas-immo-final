// Fichier : src/pages/TachesPage.jsx (Version avec Calendrier)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Spinner, Flex, Alert, AlertIcon, List, 
  Tabs, TabList, TabPanels, Tab, TabPanel, Icon 
} from '@chakra-ui/react';
import { FaList, FaCalendarAlt } from 'react-icons/fa';

import AddTaskForm from '../AddTaskForm.jsx';
import TaskItem from '../TaskItem.jsx';
import TaskCalendar from '../components/TaskCalendar.jsx';

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
        
        console.log("Chargement 1/3: Tâches...");
        const tasksRes = await axios.get(`${API_URL}/api/tasks`, config);
        setTasks(tasksRes.data);

        console.log("Chargement 2/3: Contacts...");
        const contactsRes = await axios.get(`${API_URL}/api/contacts`, config);
        setContacts(contactsRes.data);

        console.log("Chargement 3/3: Biens...");
        const propsRes = await axios.get(`${API_URL}/api/properties`, config);
        setProperties(propsRes.data);

      } catch (err) {
        console.error("Erreur (tâches):", err);
        setError("Impossible de charger les données.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  const handleTaskAdded = (newTask) => setTasks([newTask, ...tasks]);
  const handleTaskDeleted = (id) => setTasks(tasks.filter(t => t.id !== id));
  const handleTaskUpdated = (updatedTask) => setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));

  const tasksTodoCount = tasks.filter(t => t.status === 'PENDING').length;

  return (
    <Box>
      <Heading mb={6}>Agenda & Tâches</Heading>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" color="purple.500" /></Flex>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : (
        <>
          <AddTaskForm 
            token={token} 
            onTaskAdded={handleTaskAdded} 
            contacts={contacts} 
            properties={properties} 
          />

          <Box mt={8}>
            <Tabs variant="soft-rounded" colorScheme="purple">
              <TabList mb={4}>
                <Tab><Icon as={FaList} mr={2} /> Vue Liste ({tasksTodoCount})</Tab>
                <Tab><Icon as={FaCalendarAlt} mr={2} /> Vue Calendrier</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
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
                </TabPanel>

                <TabPanel p={0}>
                   <TaskCalendar tasks={tasks} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </>
      )}
    </Box>
  );
}