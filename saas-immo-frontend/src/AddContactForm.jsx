// Fichier : src/AddContactForm.jsx

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, SimpleGrid, useToast, Heading
} from '@chakra-ui/react';
import { API_URL } from './config';

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
      const response = await axios.post(`${API_URL}/api/contacts`, {
        firstName, lastName, email, phoneNumber, type
      }, config);

      if (onContactAdded) onContactAdded(response.data);

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
    <Box p={5} shadow="md" borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" mb={6}>
      <Heading size="md" mb={4} color="gray.800">Ajouter un nouveau contact</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel>Prénom</FormLabel>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Nom</FormLabel>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Téléphone</FormLabel>
              <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </FormControl>
          </SimpleGrid>

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
