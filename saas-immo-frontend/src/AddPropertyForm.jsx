// Fichier : src/AddPropertyForm.jsx (Version Finale avec Photo)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Textarea, HStack, VStack, Heading, useToast, Image, Text
} from '@chakra-ui/react';
import { supabase } from './supabaseClient'; // On importe notre connecteur

export default function AddPropertyForm({ token, onPropertyAdded }) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [description, setDescription] = useState('');
  
  // États pour l'image
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address || !price || !area) {
      toast({ title: "Erreur", description: "Adresse, Prix et Surface requis.", status: "warning" });
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = null;

    try {
      // 1. Upload de l'image (si elle existe)
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`; // Nom unique
        const filePath = `${fileName}`;

        // Envoi vers le bucket 'properties'
        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Récupération du lien public
        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
        setUploading(false);
      }

      // 2. Envoi des données au serveur (avec l'URL de l'image)
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = {
        address, city, postalCode, 
        price: parseInt(price), area: parseInt(area), 
        rooms: parseInt(rooms) || 0, bedrooms: parseInt(bedrooms) || 0, 
        description,
        imageUrl: finalImageUrl // <--- On ajoute le lien ici
      };

      // On utilise l'URL de production
      const response = await axios.post('https://api-immo-final.onrender.com/api/properties', payload, config);

      onPropertyAdded(response.data);
      
      // Reset
      setAddress(''); setCity(''); setPostalCode(''); setPrice('');
      setArea(''); setRooms(''); setBedrooms(''); setDescription('');
      setImageFile(null);

      toast({ title: "Bien ajouté avec succès !", status: "success" });

    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Problème lors de l'ajout.", status: "error" });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
      <Heading size="md" mb={4}>Ajouter un nouveau bien</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          
          <FormControl isRequired>
            <FormLabel>Adresse</FormLabel>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="10 rue de la Paix" />
          </FormControl>

          <HStack width="full">
            <FormControl><FormLabel>Ville</FormLabel><Input value={city} onChange={(e) => setCity(e.target.value)} /></FormControl>
            <FormControl><FormLabel>Code Postal</FormLabel><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></FormControl>
          </HStack>

          <HStack width="full">
            <FormControl isRequired><FormLabel>Prix (€)</FormLabel><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></FormControl>
            <FormControl isRequired><FormLabel>Surface (m²)</FormLabel><Input type="number" value={area} onChange={(e) => setArea(e.target.value)} /></FormControl>
          </HStack>

          <HStack width="full">
            <FormControl><FormLabel>Pièces</FormLabel><Input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} /></FormControl>
            <FormControl><FormLabel>Chambres</FormLabel><Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Photo du bien</FormLabel>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])} 
              p={1}
            />
            {imageFile && <Text fontSize="sm" color="green.500" mt={1}>Image sélectionnée : {imageFile.name}</Text>}
          </FormControl>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>

          <Button 
            type="submit" 
            colorScheme="blue" 
            width="full" 
            isLoading={isSubmitting || uploading}
            loadingText={uploading ? "Envoi de la photo..." : "Enregistrement..."}
          >
            Ajouter le bien
          </Button>
        </VStack>
      </form>
    </Box>
  );
}