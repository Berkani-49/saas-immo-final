// Fichier: src/components/ContactProperties.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, VStack, Text, Badge, HStack, Spinner, SimpleGrid
} from '@chakra-ui/react';
import { MdHomeWork } from 'react-icons/md';
import { API_URL } from '../config';

export default function ContactProperties({ contactId, token }) {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const config = { headers: { 'Authorization': `Bearer ${token}` } };

  useEffect(() => {
    fetchProperties();
  }, [contactId]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/contacts/${contactId}/properties`, config);
      setProperties(response.data);
    } catch (err) {
      console.error("Erreur chargement biens:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner size="sm" />;

  return (
    <Box>
      <Heading size="sm" mb={3}>Biens possédés ({properties.length})</Heading>

      {properties.length === 0 ? (
        <Text fontSize="sm" color="gray.500">Aucun bien associé</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {properties.map(property => (
            <Box key={property.id} p={3} bg="green.900" borderRadius="md" borderWidth="1px" borderColor="green.700">
              <HStack mb={2}>
                <MdHomeWork color="green" />
                <Text fontWeight="bold" fontSize="sm" color="gray.800">{property.address}</Text>
              </HStack>
              <HStack spacing={2}>
                <Badge colorScheme="green">{property.price}€</Badge>
                <Badge colorScheme="blue">{property.rooms} pièces</Badge>
                <Badge>{property.area}m²</Badge>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
