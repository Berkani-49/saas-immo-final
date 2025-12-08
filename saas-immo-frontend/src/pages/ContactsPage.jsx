// Fichier : src/pages/ContactsPage.jsx (Version Debug)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Flex, Alert, AlertIcon } from '@chakra-ui/react';
import AddContactForm from '../AddContactForm.jsx';
import ContactList from '../ContactList.jsx';

export default function ContactsPage({ token }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        console.log("Chargement des contacts...");
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo.onrender.com/api/contacts', config);
        console.log("Contacts reçus:", response.data);
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

  const handleContactAdded = (newContact) => setContacts([newContact, ...contacts]);
  const handleContactDeleted = (id) => setContacts(contacts.filter(c => c.id !== id));
  const handleContactUpdated = (updatedContact) => setContacts(contacts.map(c => (c.id === updatedContact.id ? updatedContact : c)));

  return (
    <Box>
      <Heading mb={6}>Gestion des Contacts</Heading>
      
      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

      <AddContactForm token={token} onContactAdded={handleContactAdded} />

      <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>
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