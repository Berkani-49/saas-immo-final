// Fichier : src/pages/ContactsPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Flex, Alert, AlertIcon, Button, Collapse } from '@chakra-ui/react';
import { AddIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import AddContactForm from '../AddContactForm.jsx';
import ContactList from '../ContactList.jsx';
import { API_URL } from '../config';

export default function ContactsPage({ token }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/api/contacts`, config);
        setContacts(response.data);
      } catch (err) {
        console.error("Erreur contacts:", err);
        setError("Erreur lors du chargement : " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, [token]);

  const handleContactAdded = (newContact) => {
    setContacts([newContact, ...contacts]);
    setShowForm(false);
  };
  const handleContactDeleted = (id) => setContacts(contacts.filter(c => c.id !== id));
  const handleContactUpdated = (updated) => setContacts(contacts.map(c => c.id === updated.id ? updated : c));

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="gray.800">Gestion des Contacts</Heading>
        <Button
          size="sm"
          colorScheme="blue"
          leftIcon={<AddIcon />}
          rightIcon={showForm ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          Nouveau contact
        </Button>
      </Flex>

      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

      <Collapse in={showForm} animateOpacity>
        <Box mb={6}>
          <AddContactForm token={token} onContactAdded={handleContactAdded} />
        </Box>
      </Collapse>

      <Heading as="h3" size="md" mt={showForm ? 2 : 0} mb={4} pt={4} borderTopWidth={1} borderColor="gray.200" color="gray.800">
        Vos Contacts ({contacts.length})
      </Heading>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" /></Flex>
      ) : (
        <ContactList
          contacts={contacts}
          token={token}
          onContactDeleted={handleContactDeleted}
          onContactUpdated={handleContactUpdated}
        />
      )}
    </Box>
  );
}
