// Fichier : src/AddContactForm.jsx (Version Corrigée)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, useToast, HStack, Heading
} from '@chakra-ui/react';

// Il reçoit 'onContactAdded' de son parent (la page)
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
      
      // CORRECTION ICI : Une seule requête vers la bonne adresse
      const response = await axios.post('https://saas-immo-final.onrender.com/api/contacts', {
        firstName, lastName, email, phoneNumber, type
      }, config);

      // 1. IL PRÉVIENT LE PARENT (ContactsPage)
      if (onContactAdded) {
        onContactAdded(response.data); 
      }

      // 2. Il se vide
      setFirstName(''); setLastName(''); setEmail(''); setPhoneNumber(''); setType('BUYER');

      toast({ title: "Contact ajouté !", status: "success", duration: 2000 });

    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible d'ajouter le contact.", status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" mb={6}>
      <Heading size="md" mb={4} color="white">Ajouter un nouveau contact</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <HStack width="full">
            <FormControl isRequired><FormLabel>Prénom</FormLabel><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></FormControl>
            <FormControl isRequired><FormLabel>Nom</FormLabel><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></FormControl>
          </HStack>
          <HStack width="full">
            <FormControl><FormLabel>Email</FormLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormControl>
            <FormControl><FormLabel>Téléphone</FormLabel><Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></FormControl>
          </HStack>
          <FormControl isRequired>
            <FormLabel>Type</FormLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="BUYER">Acheteur</option>
              <option value="SELLER">Vendeur</option>
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