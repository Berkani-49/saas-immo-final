// Fichier : src/Dashboard.jsx (Version Grille de Cartes)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Input, InputGroup, InputLeftElement, SimpleGrid, Text
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

import AddPropertyForm from './AddPropertyForm.jsx';
import PropertyItem from './PropertyItem.jsx';

export default function Dashboard({ token }) {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propertySearch, setPropertySearch] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://api-immo-final.onrender.com/api/properties', config);
        setProperties(response.data);
      } catch (error) {
        console.error("Erreur (biens):", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, [token]);

  const handlePropertyAdded = (newItem) => setProperties([newItem, ...properties]);
  const handlePropertyDeleted = (id) => setProperties(properties.filter(i => i.id !== id));
  const handlePropertyUpdated = (updated) => setProperties(properties.map(i => i.id === updated.id ? updated : i));

  const filteredProperties = properties.filter(p =>
    (p.address + p.city + p.postalCode).toLowerCase().includes(propertySearch.toLowerCase())
  );

  return (
    <Box>
      <Heading mb={6}>Gestion des Biens</Heading>
      
      {/* Formulaire (reste en haut) */}
      <AddPropertyForm token={token} onPropertyAdded={handlePropertyAdded} />
      
      <Flex align="center" mt={10} mb={6}>
        <Heading as="h3" size="md">
          Vos Biens en vitrine ({properties.length})
        </Heading>
      </Flex>

      {/* Barre de recherche */}
      <InputGroup mb={8} size="lg">
        <InputLeftElement pointerEvents="none"><SearchIcon color="gray.300" /></InputLeftElement>
        <Input 
            placeholder="Rechercher une adresse, une ville..." 
            value={propertySearch} 
            onChange={(e) => setPropertySearch(e.target.value)} 
            bg="white" 
            boxShadow="sm"
            border="none"
        />
      </InputGroup>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" color="blue.500" /></Flex>
      ) : (
        // C'EST ICI QUE LA MAGIE OPÈRE : LA GRILLE
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredProperties.map(p => (
            <PropertyItem 
                key={p.id} 
                property={p} 
                token={token} 
                onPropertyDeleted={handlePropertyDeleted} 
                onPropertyUpdated={handlePropertyUpdated} 
            />
          ))}
        </SimpleGrid>
      )}
      
      {!isLoading && filteredProperties.length === 0 && (
        <Text textAlign="center" color="gray.500" mt={10}>Aucun bien trouvé.</Text>
      )}
    </Box>
  );
}