// Fichier : src/AddPropertyForm.jsx (Version Finale avec Photo + Propriétaires)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, FormControl, FormLabel, Input, Textarea, HStack, VStack, Heading, useToast, Text, Select, Badge, Wrap, IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { supabase } from './supabaseClient'; // On importe le connecteur

export default function AddPropertyForm({ token, onPropertyAdded }) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nouveaux états pour les propriétaires
  const [contacts, setContacts] = useState([]);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');

  const toast = useToast();

  // Charger la liste des contacts au montage
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo.onrender.com/api/contacts', config);
        setContacts(response.data);
      } catch (err) {
        console.error("Erreur chargement contacts:", err);
      }
    };
    if (token) fetchContacts();
  }, [token]);

  // Ajouter un propriétaire à la sélection
  const handleAddOwner = () => {
    if (!selectedContactId) return;
    const contact = contacts.find(c => c.id === parseInt(selectedContactId));
    if (contact && !selectedOwners.find(o => o.id === contact.id)) {
      setSelectedOwners([...selectedOwners, contact]);
      setSelectedContactId('');
    }
  };

  // Retirer un propriétaire de la sélection
  const handleRemoveOwner = (contactId) => {
    setSelectedOwners(selectedOwners.filter(o => o.id !== contactId));
  };

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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('properties') // Nom de ton bucket
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
        setUploading(false);
      }

      // 2. Envoi des données au serveur (avec l'URL)
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = {
        address, city, postalCode, 
        price: parseInt(price), area: parseInt(area), 
        rooms: parseInt(rooms) || 0, bedrooms: parseInt(bedrooms) || 0, 
        description,
        imageUrl: finalImageUrl
      };

      const response = await axios.post('https://saas-immo.onrender.com/api/properties', payload, config);
      const newProperty = response.data;

      // 3. Ajouter les propriétaires si sélectionnés
      if (selectedOwners.length > 0) {
        for (const owner of selectedOwners) {
          try {
            await axios.post(
              `https://saas-immo.onrender.com/api/properties/${newProperty.id}/owners`,
              { contactId: owner.id },
              config
            );
          } catch (err) {
            console.error("Erreur ajout propriétaire:", err);
          }
        }
      }

      onPropertyAdded(newProperty);

      // Reset
      setAddress(''); setCity(''); setPostalCode(''); setPrice('');
      setArea(''); setRooms(''); setBedrooms(''); setDescription('');
      setImageFile(null);
      setSelectedOwners([]);
      setSelectedContactId('');
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
          <HStack width="full">
            <FormControl><FormLabel>Pièces</FormLabel><Input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} /></FormControl>
            <FormControl><FormLabel>Chambres</FormLabel><Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></FormControl>
          </HStack>
          <FormControl>
            <FormLabel>Photo du bien</FormLabel>
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} p={1} />
            {imageFile && <Text fontSize="sm" color="green.500" mt={1}>{imageFile.name}</Text>}
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>

          {/* SÉLECTION DES PROPRIÉTAIRES */}
          <FormControl>
            <FormLabel>Propriétaires (optionnel)</FormLabel>
            <HStack mb={2}>
              <Select
                placeholder="Choisir un contact"
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                size="sm"
              >
                {contacts
                  .filter(c => !selectedOwners.find(o => o.id === c.id))
                  .map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
              </Select>
              <Button size="sm" colorScheme="blue" onClick={handleAddOwner} isDisabled={!selectedContactId}>
                Ajouter
              </Button>
            </HStack>

            {/* Liste des propriétaires sélectionnés */}
            {selectedOwners.length > 0 && (
              <Wrap spacing={2} mt={2}>
                {selectedOwners.map(owner => (
                  <Badge key={owner.id} colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="md">
                    {owner.firstName} {owner.lastName}
                    <IconButton
                      icon={<CloseIcon />}
                      size="xs"
                      variant="ghost"
                      ml={1}
                      onClick={() => handleRemoveOwner(owner.id)}
                      aria-label="Retirer"
                    />
                  </Badge>
                ))}
              </Wrap>
            )}
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full" 
            isLoading={isSubmitting || uploading}
            loadingText={uploading ? "Envoi photo..." : "Enregistrement..."}>
            Ajouter le bien
          </Button>
        </VStack>
      </form>
    </Box>
  );
}