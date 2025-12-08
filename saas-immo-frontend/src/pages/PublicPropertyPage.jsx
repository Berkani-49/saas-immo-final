// Fichier : src/pages/PublicPropertyPage.jsx (Version Finale avec Carte)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Box, Image, Heading, Text, Badge, Flex, Icon, Button, VStack, Container, Center, Spinner,
  FormControl, FormLabel, Input, Textarea, useToast
} from '@chakra-ui/react';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';

// Imports pour la Carte
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Petite astuce pour corriger l'icône de marker par défaut qui bug parfois dans React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function PublicPropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // États du formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchPublicProperty = async () => {
      try {
        const response = await axios.get(`https://saas-immo.onrender.com/api/public/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        console.error("Erreur chargement", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProperty();
  }, [id]);

  const handleSendLead = async (e) => {
    e.preventDefault();
    if (!firstName || !email || !phone) {
        toast({ title: "Champs manquants", status: "warning" });
        return;
    }
    setIsSending(true);
    try {
        await axios.post('https://saas-immo.onrender.com/api/public/leads', {
            firstName, lastName, email, phone, message,
            propertyId: id
        });
        setSent(true);
        toast({ title: "Message envoyé !", description: "L'agent va vous recontacter.", status: "success" });
    } catch (error) {
        toast({ title: "Erreur", description: "Impossible d'envoyer le message.", status: "error" });
    } finally {
        setIsSending(false);
    }
  };

  if (loading) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;
  if (!property) return <Center h="100vh"><Text>Ce bien n'est plus disponible.</Text></Center>;

  return (
    <Box bg="gray.50" minH="100vh" pb={10}>
      {/* En-tête Image */}
      <Box h={{ base: "300px", md: "500px" }} w="100%" overflow="hidden" position="relative">
        <Image 
          src={property.imageUrl || "https://via.placeholder.com/800x600?text=Pas+de+photo"} 
          alt="Bien" w="100%" h="100%" objectFit="cover" 
        />
        <Badge 
            position="absolute" top={4} right={4} 
            bg="green.600" color="white" fontSize="xl" px={4} py={2} borderRadius="lg" shadow="xl"
        >
            {property.price.toLocaleString()} €
        </Badge>
      </Box>

      <Container maxW="900px" mt={-10} position="relative" zIndex={2}>
        <Box bg="white" p={8} borderRadius="2xl" shadow="xl">
            
            <Flex align="center" color="gray.500" fontSize="sm" mb={2}>
                <Icon as={FaMapMarkerAlt} mr={1} /> {property.postalCode} {property.city}
            </Flex>
            <Heading mb={6} color="gray.800">{property.address}</Heading>

            <Flex justify="space-around" py={4} borderTopWidth={1} borderBottomWidth={1} borderColor="gray.100" mb={8}>
                <VStack><Icon as={FaRulerCombined} boxSize={6} color="blue.500" /><Text fontWeight="bold">{property.area} m²</Text></VStack>
                <VStack><Icon as={FaBed} boxSize={6} color="blue.500" /><Text fontWeight="bold">{property.bedrooms} ch.</Text></VStack>
                <VStack><Icon as={FaBath} boxSize={6} color="blue.500" /><Text fontWeight="bold">{property.rooms} p.</Text></VStack>
            </Flex>

            <Text fontSize="lg" color="gray.600" lineHeight="tall" mb={10}>
                {property.description || "Aucune description disponible."}
            </Text>

            {/* --- LA CARTE (S'affiche seulement si on a les coordonnées) --- */}
            {property.latitude && property.longitude && (
                <Box mb={10} h="400px" borderRadius="xl" overflow="hidden" shadow="md" border="1px solid #E2E8F0">
                    <Heading size="sm" mb={2} px={2}>Localisation</Heading>
                    <MapContainer 
                        center={[property.latitude, property.longitude]} 
                        zoom={15} 
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false} // Pour ne pas coincer le scroll de la page
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[property.latitude, property.longitude]}>
                            <Popup>
                                {property.address} <br /> {property.price.toLocaleString()} €
                            </Popup>
                        </Marker>
                    </MapContainer>
                </Box>
            )}

            {/* FORMULAIRE DE CONTACT */}
            <Box bg="blue.50" p={6} borderRadius="xl" borderWidth="1px" borderColor="blue.100">
                <Heading size="md" mb={4} color="blue.800">Ce bien vous intéresse ?</Heading>
                
                {sent ? (
                    <Box textAlign="center" py={6}>
                        <Icon as={FaPaperPlane} w={10} h={10} color="green.500" mb={4} />
                        <Text fontSize="xl" fontWeight="bold" color="green.600">Message envoyé !</Text>
                        <Text>L'agent va vous recontacter très vite.</Text>
                    </Box>
                ) : (
                    <form onSubmit={handleSendLead}>
                        <VStack spacing={4}>
                            <Flex w="full" gap={4} direction={{ base: 'column', md: 'row' }}>
                                <FormControl isRequired><FormLabel>Prénom</FormLabel><Input bg="white" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></FormControl>
                                <FormControl isRequired><FormLabel>Nom</FormLabel><Input bg="white" value={lastName} onChange={(e) => setLastName(e.target.value)} /></FormControl>
                            </Flex>
                            <Flex w="full" gap={4} direction={{ base: 'column', md: 'row' }}>
                                <FormControl isRequired><FormLabel>Email</FormLabel><Input type="email" bg="white" value={email} onChange={(e) => setEmail(e.target.value)} /></FormControl>
                                <FormControl isRequired><FormLabel>Téléphone</FormLabel><Input type="tel" bg="white" value={phone} onChange={(e) => setPhone(e.target.value)} /></FormControl>
                            </Flex>
                            <FormControl>
                                <FormLabel>Message</FormLabel>
                                <Textarea bg="white" placeholder="Je souhaiterais visiter ce bien..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            </FormControl>
                            <Button type="submit" colorScheme="blue" size="lg" width="full" isLoading={isSending}>
                                Contacter l'agence
                            </Button>
                        </VStack>
                    </form>
                )}
            </Box>

        </Box>
      </Container>
    </Box>
  );
}