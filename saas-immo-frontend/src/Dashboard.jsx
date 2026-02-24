// Fichier : src/Dashboard.jsx (Fix: Carré noir à droite)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import {
  Box, Heading, Spinner, Flex, Input, InputGroup, InputLeftElement, SimpleGrid, Text, Button, HStack, IconButton, Collapse
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon } from '@chakra-ui/icons';

import AddPropertyForm from './AddPropertyForm.jsx';
import PropertyItem from './PropertyItem.jsx';

export default function Dashboard({ token }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRooms, setMinRooms] = useState('');

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const config = { 
        headers: { 'Authorization': `Bearer ${token}` },
        params: { city: cityFilter, minPrice, maxPrice, minRooms }
      };
      const response = await axios.get(`${API_URL}/api/properties`, config);
      setProperties(response.data);
    } catch (error) {
      console.error("Erreur (biens):", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (token) fetchProperties(); }, [token]);

  const resetFilters = () => {
    setCityFilter(''); setMinPrice(''); setMaxPrice(''); setMinRooms('');
    window.location.reload();
  };

  const handlePropertyAdded = (newItem) => setProperties([newItem, ...properties]);
  const handlePropertyDeleted = (id) => setProperties(properties.filter(i => i.id !== id));
  const handlePropertyUpdated = (updated) => setProperties(properties.map(i => i.id === updated.id ? updated : i));

  const filteredProperties = properties.filter(p => {
    const text = ((p.address || '') + (p.city || '') + (p.postalCode || '')).toLowerCase();
    return text.includes(cityFilter.toLowerCase());
  });

  return (
    <Box w="100%" maxW="100%" overflowX="hidden">

      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Heading color="gray.800">Gestion des Biens</Heading>
        <Button
          colorScheme="blue"
          size="sm"
          onClick={() => setShowAddForm(v => !v)}
          leftIcon={<Text as="span">{showAddForm ? '−' : '+'}</Text>}
        >
          {showAddForm ? 'Masquer le formulaire' : 'Ajouter un bien'}
        </Button>
      </Flex>

      <Collapse in={showAddForm} animateOpacity>
        <AddPropertyForm token={token} onPropertyAdded={(p) => { handlePropertyAdded(p); setShowAddForm(false); }} />
      </Collapse>

      <Heading as="h3" size="md" mt={10} mb={4} pt={4} borderTopWidth={1} borderColor="gray.200" color="gray.800">
        Rechercher un bien
      </Heading>

      {/* BARRE DE FILTRES */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" mb={6} borderWidth="1px" borderColor="gray.200">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} alignItems="end">
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Ville</Text>
                <InputGroup>
                    <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
                    <Input placeholder="Paris, Lyon..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
                </InputGroup>
            </Box>
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Prix Min (€)</Text>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </Box>
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Prix Max (€)</Text>
                <Input type="number" placeholder="Budget max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </Box>
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Pièces Min.</Text>
                <Input type="number" placeholder="2" value={minRooms} onChange={(e) => setMinRooms(e.target.value)} />
            </Box>
            <HStack>
                <Button colorScheme="blue" width="full" onClick={fetchProperties}>Filtrer</Button>
                <IconButton icon={<RepeatIcon />} onClick={resetFilters} aria-label="Reset" variant="outline" color="gray.600" />
            </HStack>
        </SimpleGrid>
      </Box>

      <Heading as="h4" size="sm" mb={4} color="gray.500">Résultats : {filteredProperties.length} bien(s)</Heading>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" color="blue.500" /></Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredProperties.map(p => (
            <PropertyItem 
                key={p.id} property={p} token={token} 
                onPropertyDeleted={handlePropertyDeleted} 
                onPropertyUpdated={handlePropertyUpdated} 
            />
          ))}
        </SimpleGrid>
      )}
      
      {!isLoading && filteredProperties.length === 0 && (
        <Text textAlign="center" color="gray.500" mt={10}>Aucun bien ne correspond à vos critères.</Text>
      )}
    </Box>
  );
}