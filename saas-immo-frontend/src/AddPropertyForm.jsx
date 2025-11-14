// Fichier : src/AddPropertyForm.jsx (Version Corrigée et Robuste)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Textarea, HStack, VStack, Heading, useToast, NumberInput, NumberInputField
} from '@chakra-ui/react';

export default function AddPropertyForm({ token, onPropertyAdded }) {
  // États du formulaire
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation simple
    if (!address || !price || !area) {
      toast({ title: "Champs manquants", description: "Adresse, Prix et Surface sont obligatoires.", status: "warning" });
      return;
    }

    setIsSubmitting(true);

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // Préparation des données (On s'assure que les chiffres sont bien des chiffres)
      const payload = {
        address,
        city,
        postalCode,
        price: parseInt(price),
        area: parseInt(area),
        rooms: parseInt(rooms) || 0,    // Si vide, on met 0
        bedrooms: parseInt(bedrooms) || 0, // Si vide, on met 0
        description
      };

      console.log("Envoi du bien...", payload); // Pour le débogage dans la console navigateur

      const response = await axios.post('https://saas-immo-complet.onrender.com/api/properties', payload, config);

      // Succès
      onPropertyAdded(response.data);
      
      // Reset du formulaire
      setAddress('');
      setCity('');
      setPostalCode('');
      setPrice('');
      setArea('');
      setRooms('');
      setBedrooms('');
      setDescription('');

      toast({ title: "Bien ajouté !", status: "success", duration: 2000 });

    } catch (error) {
      console.error("Erreur Frontend (Ajout Bien):", error);
      toast({ 
        title: "Erreur", 
        description: error.response?.data?.error || "Impossible d'ajouter le bien.", 
        status: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
      <Heading size="md" mb={4}>Ajouter un nouveau bien</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          
          {/* Adresse Complète */}
          <FormControl isRequired>
            <FormLabel>Adresse</FormLabel>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="10 rue de la Paix" />
          </FormControl>

          <HStack width="full">
            <FormControl>
              <FormLabel>Ville</FormLabel>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" />
            </FormControl>
            <FormControl>
              <FormLabel>Code Postal</FormLabel>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75001" />
            </FormControl>
          </HStack>

          {/* Prix et Surface */}
          <HStack width="full">
            <FormControl isRequired>
              <FormLabel>Prix (€)</FormLabel>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="350000" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Surface (m²)</FormLabel>
              <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="85" />
            </FormControl>
          </HStack>

          {/* Pièces et Chambres */}
          <HStack width="full">
            <FormControl>
              <FormLabel>Pièces</FormLabel>
              <Input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="4" />
            </FormControl>
            <FormControl>
              <FormLabel>Chambres</FormLabel>
              <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="2" />
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du bien..." />
          </FormControl>

          <Button type="submit" colorScheme="blue" width="full" isLoading={isSubmitting}>
            Ajouter le bien
          </Button>
        </VStack>
      </form>
    </Box>
  );
}