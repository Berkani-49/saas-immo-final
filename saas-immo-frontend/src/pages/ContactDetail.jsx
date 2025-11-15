// Fichier: src/pages/ContactDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Input, Select, Flex, Spacer,
  VStack, useToast, Center
} from '@chakra-ui/react';

export default function ContactDetail({ token, onLogout }) {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editFormData, setEditFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Fonction de chargement du contact ---
  useEffect(() => {
    if (!token) return;
    const fetchContact = async () => {
      setIsLoading(true);
      setError('');
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, config);
        setContact(response.data);
        setEditFormData(response.data); // Initialise le formulaire
      } catch (err) {
        console.error("Erreur chargement contact:", err);
        setError(err.response?.data?.error || "Impossible de charger ce contact.");
        if (err.response?.status === 403) onLogout();
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId, token, onLogout]);

  // --- Gestion des changements ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Sauvegarder les modifications ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      // Le backend gère déjà la validation, on envoie juste les données
      const response = await axios.put(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, editFormData, config);
      
      setContact(response.data); // Met à jour la vue
      setEditFormData(response.data); // Met à jour le form
      setIsEditing(false); // Quitte le mode édition
      toast({
        title: "Contact mis à jour.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Erreur sauvegarde contact:", err);
      setError(err.response?.data?.error || "Impossible de sauvegarder.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Center h="50vh"><Spinner size="xl" /></Center>;
  if (error && !isEditing) return (
    <Alert status="error" mt={10}>
      <AlertIcon /> {error}
      <Button ml={4} onClick={() => navigate('/')} colorScheme="gray" size="sm">Retour</Button>
    </Alert>
  );
  if (!contact && !isLoading) return <Text mt={10}>Contact non trouvé.</Text>;
  if (!editFormData) return <Center h="50vh"><Spinner size="xl" /></Center>; // S'assure que editFormData est chargé

  return (
    <Box p={5}>
      <Flex mb={6} align="center">
        <Heading as="h2" size="xl">Fiche Contact</Heading>
        <Spacer />
        <Button onClick={() => navigate('/')} colorScheme="gray" mr={3} size="sm">Retour</Button>
        {isEditing ? (
          <Button colorScheme="green" onClick={handleSave} isLoading={isSaving} loadingText="Sauvegarde..." size="sm">
            Sauvegarder
          </Button>
        ) : (
          <Button colorScheme="blue" onClick={() => {
              setEditFormData(contact); // Réinitialise
              setError('');
              setIsEditing(true);
          }} size="sm">
            Modifier
          </Button>
        )}
      </Flex>

      {isEditing && error && (
          <Alert status="error" mb={4} borderRadius="md"><AlertIcon />{error}</Alert>
      )}

      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        {isEditing ? (
          // --- FORMULAIRE D'ÉDITION ---
          <VStack as="form" onSubmit={handleSave} spacing={4} align="stretch">
            <Flex gap={4}>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Prénom</FormLabel>
                <Input name="firstName" value={editFormData.firstName} onChange={handleChange} />
              </FormControl>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Nom</FormLabel>
                <Input name="lastName" value={editFormData.lastName} onChange={handleChange} />
              </FormControl>
            </Flex>
            <Flex gap={4}>
              <FormControl flex={1}>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input name="email" type="email" value={editFormData.email || ''} onChange={handleChange} />
              </FormControl>
              <FormControl flex={1}>
                <FormLabel fontSize="sm">Téléphone</FormLabel>
                <Input name="phoneNumber" type="tel" value={editFormData.phoneNumber || ''} onChange={handleChange} />
              </FormControl>
            </Flex>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Type</FormLabel>
              <Select name="type" value={editFormData.type} onChange={handleChange}>
                <option value="BUYER">Acheteur</option>
                <option value="SELLER">Vendeur</option>
              </Select>
            </FormControl>
          </VStack>
        ) : (
          // --- MODE VUE ---
          <Box>
            <Heading as="h3" size="lg">{contact.firstName} {contact.lastName}</Heading>
            <Text mt={4}>**Email :** {contact.email || 'Non renseigné'}</Text>
            <Text>**Téléphone :** {contact.phoneNumber || 'Non renseigné'}</Text>
            <Text>**Type :** {contact.type === 'BUYER' ? 'Acheteur' : 'Vendeur'}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}