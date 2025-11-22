// Fichier : src/Dashboard.jsx (Version Recherche Avancée)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Flex, Input, InputGroup, InputLeftElement, SimpleGrid, Text, Button, HStack, Select, IconButton
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon } from '@chakra-ui/icons'; // Icône pour réinitialiser

import AddPropertyForm from './AddPropertyForm.jsx';
import PropertyItem from './PropertyItem.jsx';

export default function Dashboard({ token }) {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États des Filtres
  const [cityFilter, setCityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRooms, setMinRooms] = useState('');

  // Fonction pour charger les biens (avec ou sans filtres)
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const config = { 
        headers: { 'Authorization': `Bearer ${token}` },
        // On envoie les filtres dans l'URL
        params: {
            city: cityFilter,
            minPrice: minPrice,
            maxPrice: maxPrice,
            minRooms: minRooms
        }
      };
      
      // L'URL reste la même, mais axios ajoute les params (?city=Paris&minPrice=...)
      const response = await axios.get('https://api-immo-final.onrender.com/api/properties', config);
      setProperties(response.data);
    } catch (error) {
      console.error("Erreur (biens):", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (token) fetchProperties();
  }, [token]);

  // Fonction pour réinitialiser
  const resetFilters = () => {
    setCityFilter('');
    setMinPrice('');
    setMaxPrice('');
    setMinRooms('');
    // On recharge la liste complète (il faut attendre que les états soient vides, ou forcer le reload)
    // Petite astuce simple : on rechargera manuellement via le bouton "Rechercher" ou on force ici :
    window.location.reload(); // Le plus simple pour tout remettre à zéro proprement
  };

  // Handlers actions
  const handlePropertyAdded = (newItem) => setProperties([newItem, ...properties]);
  const handlePropertyDeleted = (id) => setProperties(properties.filter(i => i.id !== id));
  const handlePropertyUpdated = (updated) => setProperties(properties.map(i => i.id === updated.id ? updated : i));

  return (
    <Box>
      <Heading mb={6}>Gestion des Biens</Heading>
      
      <AddPropertyForm token={token} onPropertyAdded={handlePropertyAdded} />
      
      <Heading as="h3" size="md" mt={10} mb={4} pt={4} borderTopWidth={1}>
        Rechercher un bien
      </Heading>

      {/* BARRE DE FILTRES */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" mb={6} borderWidth="1px">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} alignItems="end">
            
            {/* Ville */}
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Ville</Text>
                <InputGroup>
                    <InputLeftElement pointerEvents="none"><SearchIcon color="gray.300" /></InputLeftElement>
                    <Input 
                        placeholder="Paris, Lyon..." 
                        value={cityFilter} 
                        onChange={(e) => setCityFilter(e.target.value)} 
                    />
                </InputGroup>
            </Box>

            {/* Prix Min */}
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Prix Min (€)</Text>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </Box>

            {/* Prix Max */}
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Prix Max (€)</Text>
                <Input type="number" placeholder="Budget max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </Box>

            {/* Pièces */}
            <Box>
                <Text fontSize="sm" mb={1} color="gray.600">Pièces Min.</Text>
                <Input type="number" placeholder="2" value={minRooms} onChange={(e) => setMinRooms(e.target.value)} />
            </Box>

            {/* Boutons d'action */}
            <HStack>
                <Button colorScheme="blue" width="full" onClick={fetchProperties}>
                    Filtrer
                </Button>
                <IconButton icon={<RepeatIcon />} onClick={resetFilters} aria-label="Reset" />
            </HStack>

        </SimpleGrid>
      </Box>

      {/* RÉSULTATS */}
      <Heading as="h4" size="sm" mb={4} color="gray.500">
        Résultats : {properties.length} bien(s)
      </Heading>

      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" color="blue.500" /></Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {properties.map(p => (
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
      
      {!isLoading && properties.length === 0 && (
        <Text textAlign="center" color="gray.500" mt={10}>Aucun bien ne correspond à vos critères.</Text>
      )}
    </Box>
  );
}