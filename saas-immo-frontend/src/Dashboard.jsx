// Fichier : src/Dashboard.jsx (Renommé en "Page des Biens")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, List, Spinner, Flex,
  Input, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

import AddPropertyForm from './AddPropertyForm.jsx';
import PropertyItem from './PropertyItem.jsx';

export default function BiensPage({ token }) { // Note: On reçoit "token" en props
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propertySearch, setPropertySearch] = useState('');

  // --- Chargement ---
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

  // --- Handlers ---
  const handlePropertyAdded = (newItem) => setProperties([newItem, ...properties]);
  const handlePropertyDeleted = (id) => setProperties(properties.filter(i => i.id !== id));
  const handlePropertyUpdated = (updated) => setProperties(properties.map(i => i.id === updated.id ? updated : i));

  // --- Filtre ---
  const filteredProperties = properties.filter(p =>
    (p.address + p.city + p.postalCode).toLowerCase().includes(propertySearch.toLowerCase())
  );

  return (
    <Box>
      <Heading mb={6}>Gestion des Biens</Heading>
      <AddPropertyForm token={token} onPropertyAdded={handlePropertyAdded} />
      
      <Heading as="h3" size="md" mt={8} mb={4} pt={4} borderTopWidth={1}>
        Vos Biens ({properties.length})
      </Heading>

      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none"><SearchIcon color="gray.300" /></InputLeftElement>
        <Input placeholder="Rechercher..." value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} bg="white" />
      </InputGroup>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" /></Flex>
      ) : (
        <List spacing={3}>
          {filteredProperties.map(p => (
            <PropertyItem key={p.id} property={p} token={token} onPropertyDeleted={handlePropertyDeleted} onPropertyUpdated={handlePropertyUpdated} />
          ))}
          {filteredProperties.length === 0 && <Box color="gray.500">Aucun bien trouvé.</Box>}
        </List>
      )}
    </Box>
  );
}