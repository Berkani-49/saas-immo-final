// Fichier : src/pages/ContactDetail.jsx (Version Corrigée)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Input, Select, Flex, Spacer,
  VStack, useToast, Center, Container
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';

export default function ContactDetail({ token }) {
  const { contactId } = useParams(); // On récupère l'ID depuis l'URL
  const navigate = useNavigate();
  const toast = useToast();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mode Édition
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Chargement du contact ---
  useEffect(() => {
    if (!token) return;
    const fetchContact = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        // Utilisation de la BONNE adresse serveur
        const response = await axios.get(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, config);
        setContact(response.data);
        setEditFormData(response.data);
      } catch (err) {
        console.error("Erreur chargement:", err);
        setError("Impossible de charger ce contact.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId, token]);

  // --- Sauvegarde des modifications ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, editFormData, config);
      
      setContact(response.data);
      setEditFormData(response.data);
      setIsEditing(false);
      toast({ title: "Contact mis à jour.", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Erreur sauvegarde", status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <Center h="50vh"><Spinner size="xl" color="blue.500" /></Center>;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (!contact) return <Text>Contact introuvable.</Text>;

  return (
    <Container maxW="container.md">
      <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/contacts')} mb={6} variant="ghost">
        Retour aux contacts
      </Button>

      <Box p={8} shadow="lg" borderWidth="1px" borderRadius="2xl" bg="white">
        <Flex mb={6} align="center">
          <Heading as="h2" size="lg">
            {isEditing ? "Modifier le contact" : `${contact.firstName} ${contact.lastName}`}
          </Heading>
          <Spacer />
          {!isEditing && (
            <Button colorScheme="blue" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
        </Flex>

        {isEditing ? (
          // --- FORMULAIRE ---
          <form onSubmit={handleSave}>
            <VStack spacing={4}>
              <Flex w="full" gap={4}>
                <FormControl>
                    <FormLabel>Prénom</FormLabel>
                    <Input name="firstName" value={editFormData.firstName} onChange={handleChange} />
                </FormControl>
                <FormControl>
                    <FormLabel>Nom</FormLabel>
                    <Input name="lastName" value={editFormData.lastName} onChange={handleChange} />
                </FormControl>
              </Flex>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input name="email" value={editFormData.email} onChange={handleChange} />
              </FormControl>
              
              <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <Input name="phoneNumber" value={editFormData.phoneNumber} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select name="type" value={editFormData.type} onChange={handleChange}>
                  <option value="BUYER">Acheteur</option>
                  <option value="SELLER">Vendeur</option>
                </Select>
              </FormControl>

              <Flex w="full" gap={4} mt={4}>
                <Button onClick={() => setIsEditing(false)} variant="ghost" flex={1}>Annuler</Button>
                <Button type="submit" colorScheme="green" isLoading={isSaving} flex={1}>Enregistrer</Button>
              </Flex>
            </VStack>
          </form>
        ) : (
          // --- VUE ---
          <VStack align="start" spacing={4}>
            <Box>
                <Text fontWeight="bold" color="gray.500" fontSize="sm">EMAIL</Text>
                <Text fontSize="lg">{contact.email || "Non renseigné"}</Text>
            </Box>
            <Box>
                <Text fontWeight="bold" color="gray.500" fontSize="sm">TÉLÉPHONE</Text>
                <Text fontSize="lg">{contact.phoneNumber || "Non renseigné"}</Text>
            </Box>
            <Box>
                <Text fontWeight="bold" color="gray.500" fontSize="sm">TYPE</Text>
                <Badge colorScheme={contact.type === 'BUYER' ? 'blue' : 'green'} fontSize="md" px={2} borderRadius="md">
                    {contact.type === 'BUYER' ? 'Acheteur' : 'Vendeur'}
                </Badge>
            </Box>
          </VStack>
        )}
      </Box>
    </Container>
  );
}