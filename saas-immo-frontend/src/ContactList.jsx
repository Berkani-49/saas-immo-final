// Fichier : src/ContactList.jsx (Version Grille)

import React from 'react';
import { SimpleGrid, Alert, AlertIcon, Box } from '@chakra-ui/react';
import ContactItem from './ContactItem.jsx';

export default function ContactList({ contacts, token, onContactDeleted, onContactUpdated }) {
  
  if (!contacts || contacts.length === 0) {
    return (
      <Box mt={4}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Vous n'avez aucun contact pour le moment.
        </Alert>
      </Box>
    );
  }

  // ON UTILISE UNE GRILLE (SimpleGrid) AU LIEU D'UNE LISTE
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mt={6}>
      {contacts.map(contact => (
        <ContactItem 
          key={contact.id} 
          contact={contact} 
          token={token} 
          onContactDeleted={onContactDeleted}
          onContactUpdated={onContactUpdated}
        />
      ))}
    </SimpleGrid>
  );
}