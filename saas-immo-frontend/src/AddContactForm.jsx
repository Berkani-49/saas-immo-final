// Fichier : src/AddContactForm.jsx

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, useToast, HStack, Heading
} from '@chakra-ui/react';

export default function AddContactForm({ token, onContactAdded }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [type, setType] = useState('BUYER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
        toast({ title: "Nom et Prénom requis", status: "warning" });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // 1. On envoie au serveur
      const response = await axios.post('https://saas-immo-complet.onrender.com/api/contacts', {
        firstName,
        lastName,
        email,
        phoneNumber,
        type
      }, config);

      // 2. IMPORTANT : On dit au Dashboard qu'on a fini
      onContactAdded(response.data);
      
      // 3. On vide le formulaire
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setType('BUYER');
      
      toast({ title: "Contact ajouté !", status: "success", duration: 2000 });

    } catch (error) {
      console.error("Erreur ajout contact:", error);
      toast({ title: "Erreur", description: "Impossible d'ajouter le contact.", status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
      <Heading size="md" mb={4}>Ajouter un nouveau contact</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <HStack width="full">
            <FormControl isRequired>
                <FormLabel>Prénom</FormLabel>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ex: Thomas" />
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ex: Durand" />
            </FormControl>
          </HStack>

          <HStack width="full">
            <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="thomas@email.com" />
            </FormControl>
            <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="06..." />
            </FormControl>
          </HStack>

          <FormControl isRequired>
            <FormLabel>Type de client</FormLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="BUYER">Acheteur (Cherche un bien)</option>
              <option value="SELLER">Vendeur (Vend un bien)</option>
            </Select>
          </FormControl>

          <Button type="submit" colorScheme="blue" width="full" isLoading={isSubmitting}>
            Ajouter le contact
          </Button>
        </VStack>
      </form>
    </Box>
  );
}