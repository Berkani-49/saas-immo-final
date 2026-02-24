// Fichier : src/pages/TachesPage.jsx (Version avec Calendrier)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Alert, AlertIcon, List,
  Tabs, TabList, TabPanels, Tab, TabPanel, Icon, Button, Collapse
} from '@chakra-ui/react';
import { FaList, FaCalendarAlt } from 'react-icons/fa';
import { AddIcon } from '@chakra-ui/icons';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';

import AddTaskForm from '../AddTaskForm.jsx';
import TaskItem from '../TaskItem.jsx';
import TaskCalendar from '../components/TaskCalendar.jsx';
import { API_URL } from '../config';

export default function TachesPage({ token }) {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchAllData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const tasksRes = await axios.get(`${API_URL}/api/tasks`, config);
        setTasks(tasksRes.data);
        const contactsRes = await axios.get(`${API_URL}/api/contacts`, config);
        setContacts(contactsRes.data);
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

  const handleTaskAdded = (newTask) => {
    setTasks([newTask, ...tasks]);
    setShowForm(false);
  };
  const handleTaskDeleted = (id) => setTasks(tasks.filter(t => t.id !== id));
  const handleTaskUpdated = (updatedTask) => setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));

  const tasksTodoCount = tasks.filter(t => t.status === 'PENDING').length;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="gray.800">Agenda & Tâches</Heading>
        <Button
          size="sm"
          colorScheme="brand"
          leftIcon={<AddIcon />}
          rightIcon={showForm ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          Nouvelle tâche
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" color="brand.500" /></Flex>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : (
        <>
          <Collapse in={showForm} animateOpacity>
            <Box mb={6}>
              <AddTaskForm
                token={token}
                onTaskAdded={handleTaskAdded}
                contacts={contacts}
                properties={properties}
              />
            </Box>
          </Collapse>

          <Tabs variant="soft-rounded" colorScheme="brand">
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
        </>
      )}
    </Box>
  );
}
