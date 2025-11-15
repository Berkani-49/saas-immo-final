// Fichier : src/PropertyItem.jsx (Version Finale - Affichage & Édition Photo)

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Text, Button, IconButton, Flex, Badge, Spacer, 
  FormControl, FormLabel, Input, Textarea, HStack, useToast, Image, VStack
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; // On a besoin de Supabase ici aussi

export default function PropertyItem({ property, token, onPropertyDeleted, onPropertyUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...property });
  
  // États pour la nouvelle image (en mode édition)
  const [newImageFile, setNewImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // --- Suppression ---
  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce bien ?")) return;
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://api-immo-final.onrender.com/api/properties/${property.id}`, config);
      onPropertyDeleted(property.id);
      toast({ title: "Bien supprimé.", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Erreur suppression", status: "error" });
      setIsLoading(false);
    }
  };

  // --- Sauvegarde (Modification) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    let finalImageUrl = editData.imageUrl; // Par défaut, on garde l'ancienne image

    try {
      // 1. Si une NOUVELLE image a été choisie, on l'upload
      if (newImageFile) {
        setIsUploading(true);
        const fileExt = newImageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(filePath, newImageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl; // On remplace l'URL
      }

      // 2. On envoie les données au serveur
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = { ...editData, imageUrl: finalImageUrl };

      const response = await axios.put(`https://api-immo-final.onrender.com/api/properties/${property.id}`, payload, config);
      
      onPropertyUpdated(response.data);
      setIsEditing(false);
      setNewImageFile(null);
      toast({ title: "Bien mis à jour.", status: "success" });

    } catch (err) {
      console.error(err);
      toast({ title: "Erreur lors de la modification", status: "error" });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(current => ({ ...current, [name]: value }));
  };

  // --- MODE ÉDITION ---
  if (isEditing) {
    return (
      <Box p={4} borderWidth={1} borderRadius="md" mb={4} bg="white" boxShadow="sm">
        <form onSubmit={handleSave}>
          <VStack spacing={3} align="stretch">
            
            {/* Gestion Image */}
            <FormControl>
                <FormLabel fontSize="sm">Changer la photo</FormLabel>
                <Input type="file" accept="image/*" p={1} onChange={(e) => setNewImageFile(e.target.files[0])} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Adresse</FormLabel>
              <Input name="address" value={editData.address} onChange={handleChange} />
            </FormControl>
            
            <HStack>
                <Input name="city" value={editData.city} onChange={handleChange} placeholder="Ville" />
                <Input name="postalCode" value={editData.postalCode} onChange={handleChange} placeholder="CP" />
            </HStack>
            
            <HStack>
                <Input name="price" type="number" value={editData.price} onChange={handleChange} placeholder="Prix" />
                <Input name="area" type="number" value={editData.area} onChange={handleChange} placeholder="Surface" />
            </HStack>

            <Textarea name="description" value={editData.description} onChange={handleChange} placeholder="Description" />

            <Flex mt={2}>
              <Button type="submit" colorScheme="green" size="sm" isLoading={isLoading || isUploading} loadingText="Sauvegarde...">
                Enregistrer
              </Button>
              <Button size="sm" variant="ghost" ml={2} onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    );
  }

  // --- MODE AFFICHAGE (CARTE) ---
  return (
    <Box borderWidth={1} borderRadius="lg" overflow="hidden" bg="white" mb={4} _hover={{ boxShadow: "md" }} transition="0.2s">
      <Flex>
        {/* Image à gauche (si elle existe) */}
        {property.imageUrl ? (
            <Image 
                src={property.imageUrl} 
                alt="Bien" 
                objectFit="cover" 
                width="120px" 
                height="120px"
                fallbackSrc="https://via.placeholder.com/150?text=Pas+d'image"
            />
        ) : (
            <Box width="120px" height="120px" bg="gray.100" display="flex" alignItems="center" justifyContent="center" color="gray.400">
                <Text fontSize="xs">Pas de photo</Text>
            </Box>
        )}

        {/* Contenu à droite */}
        <Box p={4} flex="1">
            <Flex alignItems="center" justify="space-between">
                <Link to={`/property/${property.id}`}>
                    <Text fontWeight="bold" fontSize="lg" color="blue.600" _hover={{ textDecoration: "underline" }}>
                        {property.address}, {property.city}
                    </Text>
                </Link>
                <Badge colorScheme="green" fontSize="0.9em">{property.price.toLocaleString()} €</Badge>
            </Flex>

            <Text fontSize="sm" color="gray.500" mt={1}>
                {property.area} m² • {property.rooms} pièces • {property.bedrooms} chambres
            </Text>

            <Text fontSize="sm" mt={2} noOfLines={2}>
                {property.description || "Aucune description."}
            </Text>
            
            {property.agent && (
                <Text fontSize="xs" color="gray.400" mt={2}>Agent : {property.agent.firstName} {property.agent.lastName}</Text>
            )}
        </Box>

        {/* Boutons d'action */}
        <Flex direction="column" justify="space-between" p={2} borderLeftWidth={1} borderColor="gray.100">
            <IconButton icon={<EditIcon />} size="sm" variant="ghost" colorScheme="blue" onClick={() => setIsEditing(true)} aria-label="Modifier" />
            <IconButton icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={isLoading} aria-label="Supprimer" />
        </Flex>
      </Flex>
    </Box>
  );
}