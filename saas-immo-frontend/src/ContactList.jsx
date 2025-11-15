// Fichier : src/ContactList.jsx (Version propre pour Sidebar)

import React from 'react';
import { List, Alert, AlertIcon, Box } from '@chakra-ui/react';
import ContactItem from './ContactItem.jsx';

// Il reçoit 'contacts' de son parent (la page)
export default function ContactList({ contacts, token, onContactDeleted, onContactUpdated }) {
  
  // Si la liste est vide, on le dit
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

  // Sinon, on affiche la liste
  return (
    <List spacing={3} mt={4}>
      {contacts.map(contact => (
        <ContactItem 
          key={contact.id} 
          contact={contact} 
          token={token} 
          onContactDeleted={onContactDeleted}
          onContactUpdated={onContactUpdated}
        />
      ))}
    </List>
  );
}