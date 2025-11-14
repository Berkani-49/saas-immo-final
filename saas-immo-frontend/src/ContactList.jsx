// Fichier : src/ContactList.jsx (Version 6 - Avec Filtres + Recherche)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContactItem from './ContactItem.jsx';

import {
  List, Alert, AlertIcon, Spinner, Heading, Box,
  Stack, Button, Text,
  Input, InputGroup, InputLeftElement // <-- Nouveaux imports pour la recherche
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons'; // <-- Import de l'icône

export default function ContactList({
  token,
  contacts,
  setContacts,
  onLogout,
  onContactDeleted,
  onContactUpdated
}) {
  const [message, setMessage] = useState('Chargement...');
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour le filtre (Acheteur/Vendeur)
  const [filter, setFilter] = useState('ALL'); 
  
  // ***** NOUVEL ÉTAT POUR LA RECHERCHE *****
  const [searchTerm, setSearchTerm] = useState('');
  // ------------------------------------

  // Chargement initial des contacts (inchangé)
  useEffect(() => {
    if (!token) return;
    const fetchContacts = async () => {
      setIsLoading(true);
      setMessage('');
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo-complet.onrender.com/api/contacts', config);
        setContacts(response.data);
        if (response.data.length === 0) {
          setMessage("Vous n'avez aucun contact.");
        }
      } catch (error) {
        console.error("Erreur (contacts):", error);
        setMessage("Erreur: Impossible de charger vos contacts.");
        if (error.response?.status === 403) onLogout();
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, [token, onLogout, setContacts]);

  
  // ***** LOGIQUE DE FILTRAGE MISE À JOUR *****
  // On combine le filtre de type ET la recherche
  const filteredContacts = contacts.filter(contact => {
    // 1. D'abord, on filtre par type (Acheteur/Vendeur/Tous)
    const typeMatch = (filter === 'ALL') || (contact.type === filter);
    if (!typeMatch) {
      return false; // Si le type ne correspond pas, on l'exclut
    }

    // 2. Ensuite, on filtre par terme de recherche
    const search = searchTerm.toLowerCase();
    if (search === '') {
      return true; // Si la barre de recherche est vide, on garde le contact
    }

    // On vérifie le nom, le prénom et l'email
    const firstName = contact.firstName?.toLowerCase() || '';
    const lastName = contact.lastName?.toLowerCase() || '';
    const email = contact.email?.toLowerCase() || '';

    return firstName.includes(search) || 
           lastName.includes(search) || 
           email.includes(search);
  });
  // ------------------------------------------

  return (
    <Box mt={8} pt={4} borderTopWidth={1}>
      <Heading as="h3" size="md" mb={4}>Liste des Contacts</Heading>

      {/* ***** BARRE DE RECHERCHE CONTACTS ***** */}
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input 
          placeholder="Rechercher par nom, prénom, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>
      {/* ------------------------------------- */}

      {/* Boutons de filtre (inchangés) */}
      <Stack direction="row" spacing={4} mb={4}>
        <Button
          size="sm"
          colorScheme={filter === 'ALL' ? 'blue' : 'gray'}
          onClick={() => setFilter('ALL')}
        >
          Tous ({contacts.length})
        </Button>
        <Button
          size="sm"
          colorScheme={filter === 'BUYER' ? 'blue' : 'gray'}
          onClick={() => setFilter('BUYER')}
        >
          Acheteurs ({contacts.filter(c => c.type === 'BUYER').length})
        </Button>
        <Button
          size="sm"
          colorScheme={filter === 'SELLER' ? 'blue' : 'gray'}
          onClick={() => setFilter('SELLER')}
        >
          Vendeurs ({contacts.filter(c => c.type === 'SELLER').length})
        </Button>
      </Stack>

      {/* Affichage des messages (Spinner, Erreur, etc.) */}
      {isLoading && <Spinner size="md" />}

      {!isLoading && message && filteredContacts.length === 0 && ( // Affiche le message seulement si la liste filtrée est vide
         <Alert status={message.startsWith('Erreur') ? 'error' : 'info'} variant="subtle" mb={4}>
            <AlertIcon />
            {message}
        </Alert>
      )}
      
      {/* Message si la recherche ne donne rien */}
      {!isLoading && !message.startsWith('Erreur') && filteredContacts.length === 0 && searchTerm.length > 0 && (
        <Text fontSize="sm" color="gray.500">Aucun contact ne correspond à votre recherche.</Text>
      )}

      {/* Affichage de la liste filtrée */}
      {!isLoading && !message.startsWith('Erreur') && (
        <List spacing={3} mt={filteredContacts.length > 0 ? 4 : 0}>
          {filteredContacts.map(contact => ( 
             <ContactItem
                key={contact.id}
                contact={contact}
                token={token}
                onContactDeleted={onContactDeleted}
                onContactUpdated={onContactUpdated}
              />
          ))}
        </List>
      )}
    </Box>
  );
}