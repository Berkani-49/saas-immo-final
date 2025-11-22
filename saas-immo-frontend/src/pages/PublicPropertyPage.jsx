// Fichier : src/pages/PublicPropertyPage.jsx (Version Capture de Leads)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Box, Image, Heading, Text, Badge, Flex, Icon, Button, VStack, Container, Center, Spinner,
  FormControl, FormLabel, Input, Textarea, useToast
} from '@chakra-ui/react';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';

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
  const [sent, setSent] = useState(false); // Pour afficher "Merci"

  useEffect(() => {
    const fetchPublicProperty = async () => {
      try {
        const response = await axios.get(`https://api-immo-final.onrender.com/api/public/properties/${id}`);
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
        await axios.post('https://api-immo-final.onrender.com/api/public/leads', {
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

      <Container maxW="800px" mt={-10} position="relative" zIndex={2}>
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

            {/* FORMULAIRE DE CONTACT (LEAD) */}
            <Box bg="blue.50" p={6} borderRadius="xl" borderWidth="1px" borderColor="blue.100">
                <Heading size="md" mb={4} color="blue.800">Ce bien vous intéresse ?</Heading>
                
                {sent ? (
                    <Box textAlign="center" py={6}>
                        <Icon as={FaPaperPlane} w={10} h={10} color="green.500" mb={4} />
                        <Text fontSize="xl" fontWeight="bold" color="green.600">Message envoyé !</Text>
                        <Text>L'agent {property.agent?.firstName} va vous recontacter très vite.</Text>
                    </Box>
                ) : (
                    <form onSubmit={handleSendLead}>
                        <VStack spacing={4}>
                            <Flex w="full" gap={4}>
                                <FormControl isRequired><FormLabel>Prénom</FormLabel><Input bg="white" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></FormControl>
                                <FormControl isRequired><FormLabel>Nom</FormLabel><Input bg="white" value={lastName} onChange={(e) => setLastName(e.target.value)} /></FormControl>
                            </Flex>
                            <Flex w="full" gap={4}>
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