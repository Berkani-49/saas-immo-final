// Fichier : src/pages/PropertyDetail.jsx (Avec PDF + Propriétaires)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon, Image, Badge, Flex, SimpleGrid, Icon, VStack
} from '@chakra-ui/react';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaFilePdf } from 'react-icons/fa';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PropertyPDF from '../components/PropertyPDF.jsx';
import PropertyOwners from '../components/PropertyOwners.jsx';

export default function PropertyDetail({ token }) {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`https://saas-immo.onrender.com/api/properties/${propertyId}`, config);
        setProperty(response.data);

        // Charger les photos multiples
        const imagesResponse = await axios.get(
          `https://saas-immo.onrender.com/api/properties/${propertyId}/images`,
          config
        );
        setImages(imagesResponse.data);
      } catch (err) {
        setError("Impossible de charger le bien.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId, token]);

  if (loading) return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" /></Flex>;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (!property) return <Text>Bien introuvable.</Text>;

  return (
    <Box>
      <Button onClick={() => navigate(-1)} mb={4} size="sm">Retour</Button>
      
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* COLONNE GAUCHE : IMAGE(S) */}
        <Box flex="1">
            {images.length > 0 ? (
              <Box>
                {/* Image principale */}
                <Image
                    src={images.find(img => img.isPrimary)?.url || images[0]?.url}
                    alt="Photo principale"
                    borderRadius="xl"
                    shadow="lg"
                    objectFit="cover"
                    w="100%"
                    h="400px"
                    mb={4}
                />

                {/* Miniatures des autres photos */}
                {images.length > 1 && (
                  <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2}>
                    {images.map((img) => (
                      <Image
                        key={img.id}
                        src={img.url}
                        alt={img.caption || "Photo"}
                        borderRadius="md"
                        objectFit="cover"
                        w="100%"
                        h="80px"
                        cursor="pointer"
                        border={img.isPrimary ? "3px solid" : "1px solid"}
                        borderColor={img.isPrimary ? "blue.500" : "gray.200"}
                        _hover={{ opacity: 0.8 }}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            ) : (
              <Image
                  src={property.imageUrl || "https://via.placeholder.com/600x400?text=Pas+de+photo"}
                  alt="Bien"
                  borderRadius="xl"
                  shadow="lg"
                  objectFit="cover"
                  w="100%"
                  h="400px"
              />
            )}
        </Box>

        {/* COLONNE DROITE : INFOS */}
        <Box flex="1">
            <Badge colorScheme="green" fontSize="xl" px={3} py={1} borderRadius="md" mb={2}>
                {property.price.toLocaleString()} €
            </Badge>
            
            <Heading mb={2}>{property.address}</Heading>
            
            <Flex align="center" color="gray.500" mb={6}>
                <Icon as={FaMapMarkerAlt} mr={2} />
                <Text fontSize="lg">{property.postalCode} {property.city}</Text>
            </Flex>

            <SimpleGrid columns={3} spacing={4} mb={6} p={4} bg="white" borderRadius="lg" shadow="sm" borderWidth="1px">
                <VStack><Icon as={FaRulerCombined} color="blue.500" boxSize={5}/><Text fontWeight="bold">{property.area} m²</Text></VStack>
                <VStack><Icon as={FaBed} color="blue.500" boxSize={5}/><Text fontWeight="bold">{property.bedrooms} ch.</Text></VStack>
                <VStack><Icon as={FaBath} color="blue.500" boxSize={5}/><Text fontWeight="bold">{property.rooms} p.</Text></VStack>
            </SimpleGrid>

            <Text color="gray.700" lineHeight="tall" mb={8}>
                {property.description || "Pas de description."}
            </Text>

            {/* BOUTON PDF MAGIQUE */}
            <PDFDownloadLink
                document={<PropertyPDF property={property} />}
                fileName={`Fiche_${property.city}_${property.id}.pdf`}
            >
                {({ blob, url, loading, error }) => (
                    <Button
                        leftIcon={<FaFilePdf />}
                        colorScheme="red"
                        width="full"
                        isLoading={loading}
                        loadingText="Génération du PDF..."
                        mb={6}
                    >
                        Télécharger la Fiche PDF
                    </Button>
                )}
            </PDFDownloadLink>

            {/* GESTION DES PROPRIÉTAIRES */}
            <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px">
                <PropertyOwners propertyId={property.id} token={token} />
            </Box>

        </Box>
      </Flex>
    </Box>
  );
}