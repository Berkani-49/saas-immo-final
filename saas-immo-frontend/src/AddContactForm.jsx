// Fichier : src/AddContactForm.jsx (Version propre pour Sidebar)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, useToast, HStack, Heading, Text
} from '@chakra-ui/react';

// Il reçoit 'onContactAdded' de son parent (la page)
export default function AddContactForm({ token, onContactAdded }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [type, setType] = useState('BUYER');

  // 🎯 Critères de recherche (pour matching automatique)
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [cityPreferences, setCityPreferences] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');
  const [minArea, setMinArea] = useState('');

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

      // Préparer les données avec critères de recherche (si BUYER)
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        type,
        // Critères de recherche (convertir en int ou null)
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        cityPreferences: cityPreferences || null,
        minBedrooms: minBedrooms ? parseInt(minBedrooms) : null,
        minArea: minArea ? parseInt(minArea) : null
      };

      const response = await axios.post('https://saas-immo.onrender.com/api/contacts', payload, config);

      // 1. IL PRÉVIENT LE PARENT (ContactsPage)
      onContactAdded(response.data);

      // 2. Il se vide
      setFirstName(''); setLastName(''); setEmail(''); setPhoneNumber(''); setType('BUYER');
      setBudgetMin(''); setBudgetMax(''); setCityPreferences(''); setMinBedrooms(''); setMinArea('');

      toast({ title: "Contact ajouté !", status: "success", duration: 2000 });

    } catch (error) {
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

          {/* 🎯 CRITÈRES DE RECHERCHE - Affichés uniquement pour les acheteurs */}
          {type === 'BUYER' && (
            <>
              <Text fontWeight="bold" fontSize="sm" color="purple.600" mt={2}>
                🎯 Critères de recherche (matching automatique)
              </Text>
              <HStack width="full">
                <FormControl>
                  <FormLabel fontSize="sm">Budget min (€)</FormLabel>
                  <Input
                    type="number"
                    placeholder="Ex: 200000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Budget max (€)</FormLabel>
                  <Input
                    type="number"
                    placeholder="Ex: 350000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel fontSize="sm">Villes préférées (séparées par des virgules)</FormLabel>
                <Input
                  placeholder="Ex: Paris, Lyon, Marseille"
                  value={cityPreferences}
                  onChange={(e) => setCityPreferences(e.target.value)}
                />
              </FormControl>
              <HStack width="full">
                <FormControl>
                  <FormLabel fontSize="sm">Chambres min</FormLabel>
                  <Input
                    type="number"
                    placeholder="Ex: 2"
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Surface min (m²)</FormLabel>
                  <Input
                    type="number"
                    placeholder="Ex: 60"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                  />
                </FormControl>
              </HStack>
            </>
          )}

          <Button type="submit" colorScheme="blue" width="full" isLoading={isSubmitting}>
            Ajouter le contact
          </Button>
        </VStack>
      </form>
    </Box>
  );
}