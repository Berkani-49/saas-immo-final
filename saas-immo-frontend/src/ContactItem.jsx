// Fichier : src/ContactItem.jsx (Version 3 - Avec Lien)

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // <-- 1. Importer Link

// 2. Importer les composants Chakra
import {
  Box, Flex, Text, Button, IconButton, Tag, Spacer,
  FormControl, FormLabel, Input, Select,
  Alert, AlertIcon, useToast, Heading, VStack
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

export default function ContactItem({ contact, token, onContactDeleted, onContactUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...contact });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr ?")) return;
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://saas-immo-complet.onrender.com/api/contacts/${contact.id}`, config);
      toast({ title: "Contact supprimé.", status: "success", duration: 2000, isClosable: true });
      onContactDeleted(contact.id);
    } catch (err) {
      console.error("Erreur (delete contact):", err);
      toast({ title: "Erreur suppression", description: err.response?.data?.error || "Impossible de supprimer.", status: "error", duration: 3000, isClosable: true });
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!editData.firstName || !editData.lastName || !editData.type) {
      setError("Prénom, nom et type sont requis.");
      setIsLoading(false);
      return;
    }
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://saas-immo-complet.onrender.com/api/contacts/${contact.id}`, editData, config);
      onContactUpdated(response.data);
      setIsEditing(false);
      toast({ title: "Contact mis à jour.", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      console.error("Erreur (update contact):", err);
      setError(err.response?.data?.error || "Erreur lors de la modification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(currentData => ({ ...currentData, [name]: value }));
  };


  if (isEditing) {
    // --- Mode ÉDITION ---
    return (
      <Box as="li" p={4} borderWidth={1} borderColor="blue.300" borderRadius="md" mb={3} bg="blue.50">
        <VStack as="form" onSubmit={handleSave} spacing={3} align="stretch">
          <Flex gap={2}>
            <FormControl isRequired flex={1}>
              <FormLabel fontSize="sm">Prénom</FormLabel>
              <Input size="sm" name="firstName" value={editData.firstName} onChange={handleChange} isDisabled={isLoading} />
            </FormControl>
            <FormControl isRequired flex={1}>
              <FormLabel fontSize="sm">Nom</FormLabel>
              <Input size="sm" name="lastName" value={editData.lastName} onChange={handleChange} isDisabled={isLoading} />
            </FormControl>
          </Flex>
          <Flex gap={2}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Email</FormLabel>
              <Input size="sm" type="email" name="email" value={editData.email || ''} onChange={handleChange} isDisabled={isLoading} />
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Téléphone</FormLabel>
              <Input size="sm" type="tel" name="phoneNumber" value={editData.phoneNumber || ''} onChange={handleChange} isDisabled={isLoading} />
            </FormControl>
          </Flex>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Type</FormLabel>
            <Select size="sm" name="type" value={editData.type} onChange={handleChange} isDisabled={isLoading}>
              <option value="BUYER">Acheteur</option>
              <option value="SELLER">Vendeur</option>
            </Select>
          </FormControl>

          {error && (
            <Alert status="error" borderRadius="md" fontSize="sm">
              <AlertIcon boxSize="16px"/> {error}
            </Alert>
          )}

          <Flex>
            <Button type="submit" colorScheme="green" size="sm" isLoading={isLoading} loadingText="Enreg...">Enregistrer</Button>
            <Button variant="ghost" size="sm" ml={2} onClick={() => {setIsEditing(false); setError('');}} isDisabled={isLoading}>Annuler</Button>
          </Flex>
        </VStack>
      </Box>
    );
  }

  // --- Mode VUE (Chakra UI) ---
  return (
    <Box as="li" p={3} borderWidth={1} borderRadius="md" mb={3} display="flex" alignItems="center">
      <Box flexGrow={1} mr={4}>
        {/* 3. Transformer le nom en Lien */}
        <Heading as="h4" size="sm">
          <Link to={`/contact/${contact.id}`} style={{ textDecoration: 'none' }}>
             <Text color="blue.600" _hover={{ textDecoration: 'underline' }}>
                {contact.firstName} {contact.lastName}
             </Text>
          </Link>
        </Heading>
        <Text fontSize="sm" color="gray.600">
          {contact.email || 'Pas d\'email'} - {contact.phoneNumber || 'Pas de tél.'}
        </Text>
      </Box>
      <Tag size="sm" colorScheme={contact.type === 'BUYER' ? 'blue' : 'green'} mr={3}>
        {contact.type === 'BUYER' ? 'Acheteur' : 'Vendeur'}
      </Tag>
      <IconButton icon={<EditIcon />} size="sm" aria-label="Modifier" variant="outline" colorScheme="yellow" onClick={() => setIsEditing(true)} mr={2} isDisabled={isLoading}/>
      <IconButton icon={<DeleteIcon />} size="sm" aria-label="Supprimer" variant="outline" colorScheme="red" onClick={handleDelete} isLoading={isLoading}/>
    </Box>
  );
}