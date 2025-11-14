// Fichier : src/PropertyItem.jsx (Version 7 - Avec Chakra UI)

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// 1. Import Chakra UI components
import {
  Box, Flex, Text, Button, IconButton, 
  FormControl, FormLabel, Input, NumberInput, NumberInputField, Textarea, 
  Spacer, Alert, AlertIcon, 
  useToast, 
  Heading // <-- AJOUTE CELUI-CI
} from '@chakra-ui/react';
// 2. Import Chakra UI Icons
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

export default function PropertyItem({ property, token, onPropertyDeleted, onPropertyUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    address: property.address || '',
    city: property.city || '',
    postalCode: property.postalCode || '',
    price: property.price || '',
    area: property.area || '',
    rooms: property.rooms || '',
    bedrooms: property.bedrooms || '',
    description: property.description || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast(); // Hook pour afficher les notifications

  // --- Fonctions (légèrement modifiées pour utiliser toast) ---

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr ?")) return;
    setIsLoading(true); // Indicateur pendant la suppression
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://saas-immo-complet.onrender.com/api/properties/${property.id}`, config);
      toast({ title: "Bien supprimé.", status: "success", duration: 2000, isClosable: true });
      onPropertyDeleted(property.id);
    } catch (err) {
      console.error("Erreur (delete):", err);
      toast({ title: "Erreur suppression", description: err.response?.data?.error || "Impossible de supprimer.", status: "error", duration: 3000, isClosable: true });
      setIsLoading(false);
    }
    // Pas de setIsLoading(false) en cas de succès, car le composant disparaît
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const parseIntOrNull = (value) => { const p = parseInt(value, 10); return isNaN(p) ? null : p; };
    const priceInt = parseIntOrNull(editData.price);
    const areaInt = parseIntOrNull(editData.area);
    const roomsInt = parseIntOrNull(editData.rooms);
    const bedroomsInt = parseIntOrNull(editData.bedrooms);

    if (!editData.address || priceInt === null || areaInt === null || roomsInt === null || bedroomsInt === null) {
      setError("Adresse, prix, surface, pièces et chambres sont obligatoires.");
      setIsLoading(false);
      return;
    }

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const updatedData = {
        address: editData.address, city: editData.city, postalCode: editData.postalCode,
        price: priceInt, area: areaInt, rooms: roomsInt, bedrooms: bedroomsInt,
        description: editData.description
      };
      const response = await axios.put(`https://saas-immo-complet.onrender.com/api/properties/${property.id}`, updatedData, config);

      onPropertyUpdated(response.data);
      setIsEditing(false);
      toast({ title: "Bien mis à jour.", status: "success", duration: 2000, isClosable: true });

    } catch (err) {
      console.error("Erreur (update):", err);
      setError(err.response?.data?.error || "Erreur lors de la modification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(currentData => ({ ...currentData, [name]: value }));
  };
  // Gère les NumberInput de Chakra
  const handleNumberChange = (valueAsString, valueAsNumber, name) => {
     setEditData(currentData => ({ ...currentData, [name]: valueAsString })); // Garde la string pour l'input
  }


  // --- AFFICHAGE ---

  if (isEditing) {
    // --- Mode ÉDITION (Formulaire Chakra UI) ---
    return (
      <Box as="li" p={4} borderWidth={1} borderColor="blue.300" borderRadius="md" mb={3} bg="blue.50">
        <form onSubmit={handleSave}>
          <FormControl mb={2} isRequired>
            <FormLabel fontSize="sm">Adresse</FormLabel>
            <Input size="sm" name="address" value={editData.address} onChange={handleChange} isDisabled={isLoading} />
          </FormControl>
          <Flex gap={2} mb={2}>
            <FormControl flex={2}>
              <FormLabel fontSize="sm">Ville</FormLabel>
              <Input size="sm" name="city" value={editData.city} onChange={handleChange} isDisabled={isLoading} />
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Code Postal</FormLabel>
              <Input size="sm" name="postalCode" value={editData.postalCode} onChange={handleChange} isDisabled={isLoading} />
            </FormControl>
          </Flex>
           <Flex gap={2} mb={2}>
            <FormControl flex={1} isRequired>
              <FormLabel fontSize="sm">Prix (€)</FormLabel>
              {/* Utilise NumberInput pour une meilleure gestion des nombres */}
              <NumberInput size="sm" value={editData.price} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'price')} isDisabled={isLoading}>
                 <NumberInputField name="price" />
              </NumberInput>
            </FormControl>
             <FormControl flex={1} isRequired>
              <FormLabel fontSize="sm">Surface (m²)</FormLabel>
              <NumberInput size="sm" value={editData.area} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'area')} isDisabled={isLoading}>
                 <NumberInputField name="area" />
              </NumberInput>
            </FormControl>
          </Flex>
          <Flex gap={2} mb={2}>
            <FormControl flex={1} isRequired>
              <FormLabel fontSize="sm">Pièces</FormLabel>
              <NumberInput size="sm" value={editData.rooms} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'rooms')} isDisabled={isLoading}>
                 <NumberInputField name="rooms" />
              </NumberInput>
            </FormControl>
            <FormControl flex={1} isRequired>
              <FormLabel fontSize="sm">Chambres</FormLabel>
              <NumberInput size="sm" value={editData.bedrooms} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'bedrooms')} isDisabled={isLoading}>
                 <NumberInputField name="bedrooms" />
              </NumberInput>
            </FormControl>
          </Flex>
          <FormControl mb={3}>
            <FormLabel fontSize="sm">Description</FormLabel>
            <Textarea size="sm" name="description" value={editData.description} onChange={handleChange} isDisabled={isLoading} />
          </FormControl>

          {error && (
            <Alert status="error" mb={3} borderRadius="md" fontSize="sm">
              <AlertIcon /> {error}
            </Alert>
          )}

          <Flex>
            <Button type="submit" colorScheme="green" size="sm" isLoading={isLoading} loadingText="Enregistre...">Enregistrer</Button>
            <Button variant="ghost" size="sm" ml={2} onClick={() => {setIsEditing(false); setError('');}} isDisabled={isLoading}>Annuler</Button>
          </Flex>
        </form>
      </Box>
    );
  }

  // --- Mode VUE (Chakra UI) ---
  return (
    // Box remplace li, p ajoute du padding, borderWidth ajoute une bordure légère
    <Box as="li" p={3} borderWidth={1} borderRadius="md" mb={3} display="flex" alignItems="center">
      <Box flexGrow={1} mr={4}> {/* flexGrow pour prendre l'espace */}
        <Heading as="h4" size="sm" mb={1}>
          {/* Link de react-router fonctionne bien avec Chakra */}
          <Link to={`/property/${property.id}`}>
             <Text color="blue.600" _hover={{ textDecoration: 'underline' }}>{property.address}</Text>
          </Link>
        </Heading>
        <Text fontSize="sm" color="gray.600">
          {property.city} - {property.price} € - {property.area} m²
        </Text>
      </Box>
      {/* IconButton pour les actions, plus compact */}
      <IconButton 
          icon={<EditIcon />} 
          size="sm" 
          aria-label="Modifier" 
          variant="outline"
          colorScheme="yellow"
          onClick={() => setIsEditing(true)} 
          mr={2} // Marge à droite
      />
      <IconButton 
          icon={<DeleteIcon />} 
          size="sm" 
          aria-label="Supprimer" 
          variant="outline"
          colorScheme="red"
          onClick={handleDelete}
          isLoading={isLoading} // Pour montrer si la suppression est en cours
      />
    </Box>
  );
}