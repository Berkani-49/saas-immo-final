// Fichier: src/pages/PropertyDetail.jsx (Version 4 - VRAIMENT PROPRE)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Input, Textarea, Flex, Spacer,
  NumberInput, NumberInputField, VStack, useToast, Center
} from '@chakra-ui/react';

// 1. On reçoit "token" et "onLogout" (venant de App.jsx)
export default function PropertyDetail({ token, onLogout }) {
  const { propertyId } = useParams(); // Récupère l'ID de l'URL
  const navigate = useNavigate();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editFormData, setEditFormData] = useState(null); // Changé de null à objet vide
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [iaError, setIaError] = useState('');

  // --- Fonction de chargement du bien ---
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Token manquant. Impossible de charger.');
      return;
    }
    const fetchProperty = async () => {
      setIsLoading(true);
      setError('');
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`https://saas-immo-complet.onrender.com/api/properties/${propertyId}`, config);
        
        setProperty(response.data);
        // Initialiser le formulaire d'édition avec les données du bien
        setEditFormData({
          address: response.data.address || '',
          city: response.data.city || '',
          postalCode: response.data.postalCode || '',
          price: response.data.price || '',
          area: response.data.area || '',
          rooms: response.data.rooms || '',
          bedrooms: response.data.bedrooms || '',
          description: response.data.description || ''
        });
      } catch (err) {
        console.error("Erreur de chargement du bien:", err);
        setError(err.response?.data?.error || "Impossible de charger les détails du bien.");
        if (err.response?.status === 403) onLogout(); // Déconnecte si token invalide
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId, token, onLogout]);

  // --- Gestion des changements dans le formulaire d'édition ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (valueStr, valueNum, name) => {
     setEditFormData(prev => ({ ...prev, [name]: valueStr }));
  };

  // --- Sauvegarder les modifications du bien ---
  const handleSave = async (e) => {
    if(e) e.preventDefault(); // Permet d'appeler la fonction sans événement
    setIsSaving(true);
    setError('');
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const parseIntStrict = (value) => {
          const parsed = parseInt(value, 10);
          return isNaN(parsed) ? null : parsed;
      };
      
      const dataToSave = {
        ...editFormData,
        price: parseIntStrict(editFormData.price),
        area: parseIntStrict(editFormData.area),
        rooms: parseIntStrict(editFormData.rooms),
        bedrooms: parseIntStrict(editFormData.bedrooms),
      };
      
      // Validation
      if (!dataToSave.address || dataToSave.price === null || dataToSave.area === null || dataToSave.rooms === null || dataToSave.bedrooms === null) {
        setError("Veuillez remplir tous les champs obligatoires (*)");
        setIsSaving(false);
        return;
      }

      const response = await axios.put(`https://saas-immo-complet.onrender.com/api/properties/${propertyId}`, dataToSave, config);
      setProperty(response.data); // Mettre à jour le bien
      setEditFormData(response.data); // Mettre à jour le formulaire
      setIsEditing(false); // Quitter le mode édition
      toast({
        title: "Bien mis à jour.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
      setError(err.response?.data?.error || "Impossible de sauvegarder les modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Générer la description IA ---
  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    setIaError('');
    setGeneratedDescription('');
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.post(`https://saas-immo-complet.onrender.com/api/properties/${propertyId}/generate-description`, {}, config);
      setGeneratedDescription(response.data.description);
      toast({
        title: "Description IA générée.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Erreur IA:", err);
      setIaError(err.response?.data?.error || "Impossible de générer la description IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Utiliser la description IA ---
  const handleUseGeneratedDescription = async () => {
    if (!generatedDescription) return;

    // 1. Met à jour l'état du formulaire local
    const updatedFormData = { ...editFormData, description: generatedDescription };
    setEditFormData(updatedFormData);
    
    // 2. Affiche le formulaire d'édition
    setIsEditing(true);

    // 3. Affiche un toast pour dire à l'utilisateur de sauvegarder
    toast({
        title: "Description IA appliquée.",
        description: "La description a été copiée. Cliquez sur 'Sauvegarder' pour l'enregistrer.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
  };

  // --- Affichage ---

  if (isLoading) return <Center h="50vh"><Spinner size="xl" /></Center>;
  
  if (error && !isEditing) return (
    <Alert status="error" mt={10}>
      <AlertIcon />
      {error}
      <Button ml={4} onClick={() => navigate('/')} colorScheme="gray" size="sm">Retour</Button>
    </Alert>
  );

  if (!property && !isLoading) return <Text mt={10}>Bien non trouvé.</Text>;

  // S'assure que editFormData n'est pas null avant de render
  if (!editFormData) return <Center h="50vh"><Spinner size="xl" /></Center>; 

  return (
    <Box p={5}>
      <Flex mb={6} align="center">
        <Heading as="h2" size="xl">Détail du Bien</Heading>
        <Spacer />
        <Button onClick={() => navigate('/')} colorScheme="gray" mr={3} size="sm">Retour</Button>
        {isEditing ? (
          <Button colorScheme="green" onClick={handleSave} isLoading={isSaving} loadingText="Sauvegarde..." size="sm">
            Sauvegarder
          </Button>
        ) : (
          <Button colorScheme="blue" onClick={() => {
              setEditFormData(property); 
              setError(''); 
              setIsEditing(true);
          }} size="sm">
            Modifier
          </Button>
        )}
      </Flex>
      
      {isEditing && error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
      )}

      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        {isEditing ? (
          // --- FORMULAIRE D'ÉDITION ---
          <VStack as="form" onSubmit={handleSave} spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="sm">Adresse</FormLabel>
              <Input name="address" value={editFormData.address} onChange={handleChange} />
            </FormControl>
            <Flex gap={4}>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Ville</FormLabel>
                <Input name="city" value={editFormData.city} onChange={handleChange} />
              </FormControl>
              <FormControl flex={1}>
                <FormLabel fontSize="sm">Code Postal</FormLabel>
                <Input name="postalCode" value={editFormData.postalCode} onChange={handleChange} />
              </FormControl>
            </Flex>
            <Flex gap={4}>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Prix (€)</FormLabel>
                <NumberInput value={editFormData.price} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'price')}>
                  <NumberInputField name="price" />
                </NumberInput>
              </FormControl>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Surface (m²)</FormLabel>
                <NumberInput value={editFormData.area} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'area')}>
                  <NumberInputField name="area" />
                </NumberInput>
              </FormControl>
            </Flex>
            <Flex gap={4}>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Pièces</FormLabel>
                <NumberInput value={editFormData.rooms} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'rooms')}>
                  <NumberInputField name="rooms" />
                </NumberInput>
              </FormControl>
              <FormControl isRequired flex={1}>
                <FormLabel fontSize="sm">Chambres</FormLabel>
                <NumberInput value={editFormData.bedrooms} onChange={(vStr, vNum) => handleNumberChange(vStr, vNum, 'bedrooms')}>
                  <NumberInputField name="bedrooms" />
                </NumberInput>
              </FormControl>
            </Flex>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={editFormData.description} onChange={handleChange} />
            </FormControl>
          </VStack>
        ) : (
          // --- MODE VUE ---
          <Box>
            <Text fontSize="lg" fontWeight="bold">{property.address}, {property.postalCode} {property.city}</Text>
            <Text mt={2}>**Prix :** {property.price.toLocaleString('fr-FR')} €</Text>
            <Text>**Surface :** {property.area} m²</Text>
            <Text>**Pièces :** {property.rooms}</Text>
            <Text>**Chambres :** {property.bedrooms}</Text>
            <Text mt={4} whiteSpace="pre-wrap">**Description :** {property.description || "Aucune description."}</Text>
          </Box>
        )}
      </Box>

      {/* --- Section IA --- */}
      <Box mt={8} p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="gray.50">
        <Heading as="h3" size="md" mb={4}>Assistant IA</Heading>
        <Button
          colorScheme="purple"
          onClick={handleGenerateDescription}
          isLoading={isGenerating}
          loadingText="Génération..."
          isDisabled={isSaving}
        >
          Générer une description IA
        </Button>

        {iaError && (
          <Alert status="error" mt={4} borderRadius="md" fontSize="sm">
            <AlertIcon boxSize="16px" /> {iaError}
          </Alert>
        )}

        {generatedDescription && (
          <Box mt={4} p={3} bg="purple.100" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold">Description IA suggérée :</Text>
            <Text fontSize="sm" mt={2} whiteSpace="pre-wrap">{generatedDescription}</Text>
            <Button
              mt={3}
              colorScheme="green"
              size="sm"
              onClick={handleUseGeneratedDescription}
              isDisabled={isSaving || isGenerating}
            >
              Utiliser cette description
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}