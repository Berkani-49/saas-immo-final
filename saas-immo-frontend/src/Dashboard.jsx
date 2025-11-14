// Fichier : src/Dashboard.jsx (Version 11 - Avec Tâches)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Button, Tabs, TabList, TabPanels, Tab, TabPanel,
  List, Spinner, Alert, AlertIcon, Flex, Spacer,
  Input, InputGroup, InputLeftElement, Badge
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

// Imports de nos composants
import AddPropertyForm from './AddPropertyForm.jsx';
import AddContactForm from './AddContactForm.jsx';
import ContactList from './ContactList.jsx';
import PropertyItem from './PropertyItem.jsx';
import TaskItem from './TaskItem.jsx';     // <--- NOUVEAU
import AddTaskForm from './AddTaskForm.jsx'; // <--- NOUVEAU

export default function Dashboard({ token, onLogout }) {
  // Données
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tasks, setTasks] = useState([]); // <--- NOUVEAU

  // États de chargement/messages
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Recherche Biens
  const [propertySearch, setPropertySearch] = useState('');

  // --- CHARGEMENT INITIAL (Tout charger d'un coup) ---
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // On lance les 3 requêtes en parallèle
        const [propsRes, contactsRes, tasksRes] = await Promise.all([
          axios.get('https://saas-immo-complet.onrender.com/api/properties', config),
          axios.get('https://saas-immo-complet.onrender.com/api/contacts', config),
          axios.get('https://saas-immo-complet.onrender.com/api/tasks', config) // <--- NOUVEAU
        ]);

        setProperties(propsRes.data);
        setContacts(contactsRes.data);
        setTasks(tasksRes.data); // <--- NOUVEAU

      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
        setMessage("Erreur lors du chargement des données.");
        if (error.response?.status === 403) onLogout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, onLogout]);


  // --- HANDLERS (Mise à jour de l'interface sans recharger) ---
  
  // Biens
  const handlePropertyAdded = (newItem) => setProperties([newItem, ...properties]);
  const handlePropertyDeleted = (id) => setProperties(properties.filter(i => i.id !== id));
  const handlePropertyUpdated = (updated) => setProperties(properties.map(i => i.id === updated.id ? updated : i));

  // Contacts
  const handleContactAdded = (newItem) => setContacts([newItem, ...contacts]);
  const handleContactDeleted = (id) => setContacts(contacts.filter(i => i.id !== id));
  const handleContactUpdated = (updated) => setContacts(contacts.map(i => i.id === updated.id ? updated : i));

  // Tâches (NOUVEAU)
  const handleTaskAdded = (newItem) => setTasks([newItem, ...tasks]);
  const handleTaskDeleted = (id) => setTasks(tasks.filter(i => i.id !== id));
  const handleTaskUpdated = (updated) => setTasks(tasks.map(i => i.id === updated.id ? { ...i, ...updated, contact: i.contact, property: i.property } : i));


  // Filtre Recherche Biens
  const filteredProperties = properties.filter(p => 
    (p.address + p.city + p.postalCode).toLowerCase().includes(propertySearch.toLowerCase())
  );

  // Calcul du nombre de tâches à faire
  const tasksTodoCount = tasks.filter(t => t.status === 'PENDING').length;

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} pb={4} borderBottomWidth={1} alignItems="center">
        <Heading as="h2" size="lg">Tableau de Bord</Heading>
        <Spacer />
        <Button as={RouterLink} to="/estimate" colorScheme="teal" size="sm" mr={4}>
          Estimer un prix 🧠
        </Button>
        <Button colorScheme="red" size="sm" onClick={onLogout}>
          Déconnexion
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" mt={10}><Spinner size="xl" /></Flex>
      ) : (
        <Tabs isLazy colorScheme="purple" variant="enclosed">
          <TabList>
            <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Mes Biens</Tab>
            <Tab _selected={{ color: 'white', bg: 'green.500' }}>Mes Contacts</Tab>
            <Tab _selected={{ color: 'white', bg: 'purple.500' }}>
               Mes Tâches 
               {tasksTodoCount > 0 && (
                 <Badge ml={2} colorScheme="red" borderRadius="full">{tasksTodoCount}</Badge>
               )}
            </Tab>
          </TabList>

          <TabPanels>
            
            {/* 1. ONGLET BIENS */}
            <TabPanel>
              <AddPropertyForm token={token} onPropertyAdded={handlePropertyAdded} />
              <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>Vos Biens ({properties.length})</Heading>
              
              <InputGroup mb={4}>
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.300" /></InputLeftElement>
                <Input placeholder="Rechercher..." value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} />
              </InputGroup>

              <List spacing={3}>
                {filteredProperties.map(p => ( 
                  <PropertyItem key={p.id} property={p} token={token} onPropertyDeleted={handlePropertyDeleted} onPropertyUpdated={handlePropertyUpdated} /> 
                ))}
                {filteredProperties.length === 0 && <Box color="gray.500">Aucun bien trouvé.</Box>}
              </List>
            </TabPanel>

            {/* 2. ONGLET CONTACTS */}
            <TabPanel>
              <AddContactForm token={token} onContactAdded={handleContactAdded} />
              <ContactList token={token} contacts={contacts} setContacts={setContacts} onContactDeleted={handleContactDeleted} onContactUpdated={handleContactUpdated} />
            </TabPanel>

            {/* 3. ONGLET TÂCHES (NOUVEAU) */}
            <TabPanel>
              <AddTaskForm 
                token={token} 
                onTaskAdded={handleTaskAdded} 
                contacts={contacts} 
                properties={properties} 
              />
              
              <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>
                À Faire ({tasksTodoCount})
              </Heading>
              
              {tasks.length === 0 && <Alert status="info"><AlertIcon />Aucune tâche pour le moment.</Alert>}

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
            </TabPanel>

          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
}