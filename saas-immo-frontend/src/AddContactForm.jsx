// Fichier : src/AddContactForm.jsx

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, SimpleGrid, useToast, Heading, HStack
} from '@chakra-ui/react';

const PHONE_PREFIXES = [
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+32', label: '🇧🇪 +32' },
  { code: '+41', label: '🇨🇭 +41' },
  { code: '+352', label: '🇱🇺 +352' },
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+213', label: '🇩🇿 +213' },
  { code: '+216', label: '🇹🇳 +216' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+31', label: '🇳🇱 +31' },
  { code: '+351', label: '🇵🇹 +351' },
  { code: '+1', label: '🇺🇸 +1' },
];
import { API_URL } from './config';

export default function AddContactForm({ token, onContactAdded }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+33');
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
        firstName, lastName, email, phoneNumber: phonePrefix + phoneNumber, type
      }, config);

      if (onContactAdded) onContactAdded(response.data);

      setFirstName(''); setLastName(''); setEmail(''); setPhonePrefix('+33'); setPhoneNumber(''); setType('BUYER');
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
              <HStack spacing={0}>
                <Select
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  w="120px"
                  borderRightRadius={0}
                  flexShrink={0}
                >
                  {PHONE_PREFIXES.map(p => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                </Select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="6 12 34 56 78"
                  borderLeftRadius={0}
                />
              </HStack>
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
