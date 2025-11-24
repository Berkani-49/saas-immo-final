// Fichier : src/pages/ContactDetail.jsx (Version Robuste)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Input, Select, Flex, VStack
} from '@chakra-ui/react';

// On n'utilise pas d'icônes complexes pour éviter les crashs d'import
export default function ContactDetail({ token }) {
  const { contactId } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchContact = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, config);
        setContact(response.data);
        setEditFormData(response.data);
      } catch (err) {
        console.error("Erreur contact:", err);
        setError("Impossible de charger ce contact.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId, token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, editFormData, config);
      setContact(response.data);
      setIsEditing(false);
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <Flex justify="center" p={10}><Spinner /></Flex>;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (!contact) return <Text>Contact introuvable.</Text>;

  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" maxW="800px" mx="auto">
      <Button onClick={() => navigate('/contacts')} mb={6} size="sm" variant="outline">
        ← Retour
      </Button>

      <Flex mb={6} align="center" justify="space-between">
        <Heading size="lg">{contact.firstName} {contact.lastName}</Heading>
        {!isEditing && <Button colorScheme="blue" onClick={() => setIsEditing(true)}>Modifier</Button>}
      </Flex>

      {isEditing ? (
        <form onSubmit={handleSave}>
          <VStack spacing={4}>
            <Flex w="full" gap={4}>
                <FormControl><FormLabel>Prénom</FormLabel><Input name="firstName" value={editFormData.firstName} onChange={handleChange} /></FormControl>
                <FormControl><FormLabel>Nom</FormLabel><Input name="lastName" value={editFormData.lastName} onChange={handleChange} /></FormControl>
            </Flex>
            <FormControl><FormLabel>Email</FormLabel><Input name="email" value={editFormData.email} onChange={handleChange} /></FormControl>
            <FormControl><FormLabel>Téléphone</FormLabel><Input name="phoneNumber" value={editFormData.phoneNumber} onChange={handleChange} /></FormControl>
            <FormControl><FormLabel>Type</FormLabel>
                <Select name="type" value={editFormData.type} onChange={handleChange}>
                  <option value="BUYER">Acheteur</option>
                  <option value="SELLER">Vendeur</option>
                </Select>
            </FormControl>
            <Flex w="full" gap={4} mt={4}>
                <Button onClick={() => setIsEditing(false)} flex={1} variant="ghost">Annuler</Button>
                <Button type="submit" colorScheme="green" flex={1} isLoading={isSaving}>Enregistrer</Button>
            </Flex>
          </VStack>
        </form>
      ) : (
        <VStack align="start" spacing={4}>
            <Box>
                <Text fontWeight="bold" color="gray.500" fontSize="xs">EMAIL</Text>
                <Text fontSize="md">{contact.email || "-"}</Text>
            </Box>
            <Box>
                <Text fontWeight="bold" color="gray.500" fontSize="xs">TÉLÉPHONE</Text>
                <Text fontSize="md">{contact.phoneNumber || "-"}</Text>
            </Box>
            <Box>
                <Text fontWeight="bold" color="gray.500" fontSize="xs">TYPE</Text>
                <Text fontSize="md">{contact.type === 'BUYER' ? 'Acheteur' : 'Vendeur'}</Text>
            </Box>
        </VStack>
      )}
    </Box>
  );
}