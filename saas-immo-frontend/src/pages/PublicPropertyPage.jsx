// Fichier : src/pages/PublicPropertyPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Box, Image, Heading, Text, Badge, Flex, Icon, Button, VStack, Container, Center, Spinner 
} from '@chakra-ui/react';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

export default function PublicPropertyPage() {
  const { id } = useParams(); // On récupère l'ID dans l'URL
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicProperty = async () => {
      try {
        // Note : On appelle la route /api/public/...
        const response = await axios.get(`https://api-immo-final.onrender.com/api/public/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        console.error("Erreur chargement bien public", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProperty();
  }, [id]);

  if (loading) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;
  if (!property) return <Center h="100vh"><Text>Ce bien n'est plus disponible.</Text></Center>;

  return (
    <Box bg="gray.50" minH="100vh" pb={10}>
      {/* 1. Grande Image d'en-tête */}
      <Box h={{ base: "300px", md: "500px" }} w="100%" overflow="hidden" position="relative">
        <Image 
          src={property.imageUrl || "https://via.placeholder.com/800x600?text=Pas+de+photo"} 
          alt="Bien" w="100%" h="100%" objectFit="cover" 
        />
        <Badge 
            position="absolute" bottom={4} right={4} 
            colorScheme="green" fontSize="xl" px={4} py={2} borderRadius="lg" shadow="xl"
        >
            {property.price.toLocaleString()} €
        </Badge>
      </Box>

      <Container maxW="800px" mt={-10} position="relative" zIndex={2}>
        <Box bg="white" p={6} borderRadius="2xl" shadow="xl">
            
            {/* Titre et Adresse */}
            <Flex align="center" color="gray.500" fontSize="sm" mb={2}>
                <Icon as={FaMapMarkerAlt} mr={1} /> {property.postalCode} {property.city}
            </Flex>
            <Heading mb={4} color="gray.800">{property.address}</Heading>

            {/* Caractéristiques */}
            <Flex justify="space-around" py={4} borderTopWidth={1} borderBottomWidth={1} borderColor="gray.100" mb={6}>
                <VStack><Icon as={FaRulerCombined} boxSize={6} color="blue.500" /><Text fontWeight="bold">{property.area} m²</Text></VStack>
                <VStack><Icon as={FaBed} boxSize={6} color="blue.500" /><Text fontWeight="bold">{property.bedrooms} ch.</Text></VStack>
                <VStack><Icon as={FaBath} boxSize={6} color="blue.500" /><Text fontWeight="bold">{property.rooms} p.</Text></VStack>
            </Flex>

            {/* Description */}
            <Text fontSize="lg" color="gray.600" lineHeight="tall" mb={8}>
                {property.description || "Aucune description disponible."}
            </Text>

            {/* Contact Agent */}
            {property.agent && (
                <Box bg="blue.50" p={4} borderRadius="xl">
                    <Text fontWeight="bold" mb={2}>Intéressé ? Contactez votre agent :</Text>
                    <Text fontSize="lg">👤 {property.agent.firstName} {property.agent.lastName}</Text>
                    <Button 
                        as="a" href={`mailto:${property.agent.email}`}
                        leftIcon={<FaPhone />} colorScheme="blue" mt={3} w="full"
                    >
                        Contacter l'agence
                    </Button>
                </Box>
            )}
        </Box>
      </Container>
    </Box>
  );
}