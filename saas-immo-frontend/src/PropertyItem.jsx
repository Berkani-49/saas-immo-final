// Fichier : src/PropertyItem.jsx (Design Carte Airbnb)

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Text, Button, IconButton, Flex, Badge, Image, VStack, HStack, useToast,
  FormControl, FormLabel, Input, Textarea
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa'; // On utilise des icônes parlantes
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function PropertyItem({ property, token, onPropertyDeleted, onPropertyUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...property });
  const [newImageFile, setNewImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // --- DELETE ---
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

  // --- SAVE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let finalImageUrl = editData.imageUrl;

    try {
      if (newImageFile) {
        setIsUploading(true);
        const fileExt = newImageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, newImageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = { ...editData, imageUrl: finalImageUrl };
      const response = await axios.put(`https://api-immo-final.onrender.com/api/properties/${property.id}`, payload, config);
      
      onPropertyUpdated(response.data);
      setIsEditing(false);
      setNewImageFile(null);
      toast({ title: "Bien mis à jour.", status: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur modification", status: "error" });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(current => ({ ...current, [name]: value }));
  };

  // --- MODE ÉDITION (Resté simple) ---
  if (isEditing) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg" bg="white" shadow="md">
        <form onSubmit={handleSave}>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold" color="blue.600">Modifier le bien</Text>
            <FormControl><FormLabel fontSize="sm">Nouvelle photo</FormLabel><Input type="file" accept="image/*" p={1} onChange={(e) => setNewImageFile(e.target.files[0])} /></FormControl>
            <Input name="address" value={editData.address} onChange={handleChange} placeholder="Adresse" />
            <HStack>
                <Input name="city" value={editData.city} onChange={handleChange} placeholder="Ville" />
                <Input name="price" type="number" value={editData.price} onChange={handleChange} placeholder="Prix" />
            </HStack>
            <HStack>
                <Input name="area" type="number" value={editData.area} onChange={handleChange} placeholder="m²" />
                <Input name="rooms" type="number" value={editData.rooms} onChange={handleChange} placeholder="Pièces" />
            </HStack>
            <Flex mt={2} gap={2}>
              <Button type="submit" colorScheme="green" size="sm" isLoading={isLoading || isUploading}>Sauvegarder</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    );
  }

  // --- MODE VUE (CARTE) ---
  return (
    <Box 
      borderWidth="1px" borderRadius="2xl" overflow="hidden" bg="white" 
      transition="all 0.3s" _hover={{ transform: 'translateY(-5px)', shadow: 'xl' }}
      position="relative"
    >
      {/* 1. L'IMAGE EN HAUT (Grande) */}
      <Box h="200px" w="100%" position="relative" overflow="hidden">
        <Image 
          src={property.imageUrl || "https://via.placeholder.com/400x300?text=Pas+de+photo"} 
          alt="Bien" 
          w="100%" h="100%" objectFit="cover"
          transition="0.3s"
          _hover={{ transform: 'scale(1.05)' }}
        />
        <Badge 
            position="absolute" top={3} right={3} 
            colorScheme="green" fontSize="0.9em" px={2} py={1} borderRadius="md" shadow="md"
        >
            {property.price.toLocaleString()} €
        </Badge>
      </Box>

      {/* 2. LES INFOS EN DESSOUS */}
      <Box p={5}>
        <Flex alignItems="center" color="gray.500" fontSize="sm" mb={2}>
            <FaMapMarkerAlt style={{ marginRight: '5px' }} />
            <Text textTransform="uppercase" fontWeight="bold" letterSpacing="wide">
                {property.city}
            </Text>
        </Flex>

        <Link to={`/property/${property.id}`}>
            <Text fontWeight="bold" fontSize="xl" lineHeight="tight" noOfLines={1} mb={2} _hover={{ color: 'blue.500' }}>
                {property.address}
            </Text>
        </Link>

        {/* Les icônes de détails */}
        <HStack spacing={4} color="gray.600" fontSize="sm" mb={4}>
            <Flex align="center"><FaRulerCombined /><Text ml={1}>{property.area} m²</Text></Flex>
            <Flex align="center"><FaBed /><Text ml={1}>{property.bedrooms} ch.</Text></Flex>
            <Flex align="center"><FaBath /><Text ml={1}>{property.rooms} p.</Text></Flex>
        </HStack>

        {/* Boutons d'action discrets */}
        <Flex pt={3} borderTopWidth={1} borderColor="gray.100" justify="space-between" align="center">
            {property.agent ? (
                <Text fontSize="xs" color="gray.400">Agent: {property.agent.firstName}</Text>
            ) : <Spacer />}
            
            <Box>
                <IconButton icon={<EditIcon />} size="sm" variant="ghost" colorScheme="blue" onClick={() => setIsEditing(true)} aria-label="Modifier" mr={1} />
                <IconButton icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={isLoading} aria-label="Supprimer" />
            </Box>
        </Flex>
      </Box>
    </Box>
  );
}