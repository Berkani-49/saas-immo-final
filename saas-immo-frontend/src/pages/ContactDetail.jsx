// Fichier : src/pages/ContactDetail.jsx (Version Ultra-Simple sans Icônes)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Input, Select, Flex, VStack, useToast
} from '@chakra-ui/react';

export default function ContactDetail({ token }) {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId, token]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://api-immo-final.onrender.com/api/contacts/${contactId}`, editFormData, config);
      setContact(response.data);
      setIsEditing(false);
      toast({ title: "Succès", status: "success" });
    } catch (err) {
      toast({ title: "Erreur", status: "error" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <Box p={10}><Spinner /></Box>;
  if (!contact) return <Box p={10}><Text>Contact introuvable.</Text></Box>;

  return (
    <Box p={8} bg="white" borderRadius="lg" shadow="sm">
      <Button onClick={() => navigate('/contacts')} mb={6} size="sm">
        Retour
      </Button>

      <Heading size="lg" mb={6}>{contact.firstName} {contact.lastName}</Heading>

      {isEditing ? (
        <form onSubmit={handleSave}>
          <VStack spacing={4}>
            <FormControl><FormLabel>Prénom</FormLabel><Input name="firstName" value={editFormData.firstName} onChange={handleChange} /></FormControl>
            <FormControl><FormLabel>Nom</FormLabel><Input name="lastName" value={editFormData.lastName} onChange={handleChange} /></FormControl>
            <FormControl><FormLabel>Email</FormLabel><Input name="email" value={editFormData.email} onChange={handleChange} /></FormControl>
            <FormControl><FormLabel>Téléphone</FormLabel><Input name="phoneNumber" value={editFormData.phoneNumber} onChange={handleChange} /></FormControl>
            <FormControl><FormLabel>Type</FormLabel>
                <Select name="type" value={editFormData.type} onChange={handleChange}>
                  <option value="BUYER">Acheteur</option>
                  <option value="SELLER">Vendeur</option>
                </Select>
            </FormControl>
            <Flex gap={4} mt={4}>
                <Button onClick={() => setIsEditing(false)}>Annuler</Button>
                <Button type="submit" colorScheme="green">Enregistrer</Button>
            </Flex>
          </VStack>
        </form>
      ) : (
        <VStack align="start" spacing={4}>
            <Text><strong>Email:</strong> {contact.email}</Text>
            <Text><strong>Tél:</strong> {contact.phoneNumber}</Text>
            <Text><strong>Type:</strong> {contact.type}</Text>
            <Button colorScheme="blue" onClick={() => setIsEditing(true)} mt={4}>Modifier</Button>
        </VStack>
      )}
    </Box>
  );
}