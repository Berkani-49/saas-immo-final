// Fichier : src/pages/ContactsPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Flex, Alert, AlertIcon } from '@chakra-ui/react';

// On réutilise les composants qu'on a déjà !
import AddContactForm from '../AddContactForm.jsx';
import ContactList from '../ContactList.jsx';

export default function ContactsPage({ token }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Chargement des contacts ---
  useEffect(() => {
    if (!token) return;
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo-complet.onrender.com/api/contacts', config);
        setContacts(response.data);
      } catch (err) {
        console.error("Erreur (contacts):", err);
        setError("Impossible de charger les contacts.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, [token]);

  // --- Handlers (Mise à jour de l'interface) ---
  const handleContactAdded = (newContact) => {
    setContacts([newContact, ...contacts]);
  };
  
  const handleContactDeleted = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };
  
  const handleContactUpdated = (updatedContact) => {
    setContacts(contacts.map(c => (c.id === updatedContact.id ? updatedContact : c)));
  };

  return (
    <Box>
      <Heading mb={6}>Gestion des Contacts</Heading>

      {/* Le formulaire d'ajout */}
      <AddContactForm token={token} onContactAdded={handleContactAdded} />

      <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>
        Vos Contacts ({contacts.length})
      </Heading>

      {/* Affichage de la liste */}
      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" /></Flex>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
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