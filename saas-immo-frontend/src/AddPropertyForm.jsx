// Fichier : src/AddPropertyForm.jsx (Version avec Propriétaire)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Textarea, HStack, VStack, Heading, useToast, Text, Select
} from '@chakra-ui/react';
import { supabase } from './supabaseClient';

export default function AddPropertyForm({ token, onPropertyAdded }) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [description, setDescription] = useState('');
  
  // Nouveau : Le Propriétaire
  const [contactId, setContactId] = useState('');
  const [contacts, setContacts] = useState([]); // La liste pour le menu déroulant

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Charger les contacts au démarrage
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo-final.onrender.com/api/contacts', config);
        setContacts(response.data);
      } catch (error) {
        console.error("Erreur chargement contacts", error);
      }
    };
    fetchContacts();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address || !price || !area) {
      toast({ title: "Erreur", description: "Adresse, Prix et Surface requis.", status: "warning" });
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = null;

    try {
      // 1. Upload Image
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
        setUploading(false);
      }

      // 2. Envoi Données
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = {
        address, city, postalCode, 
        price: parseInt(price), area: parseInt(area), 
        rooms: parseInt(rooms) || 0, bedrooms: parseInt(bedrooms) || 0, 
        description,
        imageUrl: finalImageUrl,
        // On ajoute le propriétaire !
        contactId: contactId ? parseInt(contactId) : null 
      };

      const response = await axios.post('https://saas-immo-final.onrender.com/api/properties', payload, config);

      // On enrichit l'objet retourné avec les infos du contact pour l'affichage immédiat
      const newProperty = { 
        ...response.data, 
        contact: contacts.find(c => c.id === parseInt(contactId)) 
      };

      onPropertyAdded(newProperty);
      
      // Reset
      setAddress(''); setCity(''); setPostalCode(''); setPrice('');
      setArea(''); setRooms(''); setBedrooms(''); setDescription('');
      setImageFile(null); setContactId('');

      toast({ title: "Bien ajouté !", status: "success" });

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
      <Heading size="md" mb={4}>Ajouter un bien</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          
          <FormControl isRequired>
            <FormLabel>Adresse</FormLabel>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormControl>

          <HStack width="full">
            <FormControl><FormLabel>Ville</FormLabel><Input value={city} onChange={(e) => setCity(e.target.value)} /></FormControl>
            <FormControl><FormLabel>Code Postal</FormLabel><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></FormControl>
          </HStack>

          <HStack width="full">
            <FormControl isRequired><FormLabel>Prix (€)</FormLabel><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></FormControl>
            <FormControl isRequired><FormLabel>Surface (m²)</FormLabel><Input type="number" value={area} onChange={(e) => setArea(e.target.value)} /></FormControl>
          </HStack>

          {/* LE NOUVEAU CHAMP PROPRIÉTAIRE */}
          <FormControl>
            <FormLabel>Propriétaire (Vendeur)</FormLabel>
            <Select placeholder="Sélectionner un contact existant" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} ({contact.type === 'SELLER' ? 'Vendeur' : 'Acheteur'})
                    </option>
                ))}
            </Select>
          </FormControl>

          <HStack width="full">
            <FormControl><FormLabel>Pièces</FormLabel><Input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} /></FormControl>
            <FormControl><FormLabel>Chambres</FormLabel><Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Photo</FormLabel>
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} p={1} />
            {imageFile && <Text fontSize="sm" color="green.500">{imageFile.name}</Text>}
          </FormControl>

          <FormControl><FormLabel>Description</FormLabel><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></FormControl>

          <Button type="submit" colorScheme="brand" width="full" isLoading={isSubmitting} loadingText="Enregistrement...">
            Ajouter le bien
          </Button>
        </VStack>
      </form>
    </Box>
  );
}