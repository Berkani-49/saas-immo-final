// Composant : MatchingModal - Affiche les acheteurs matchés avec un bien
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, Button, VStack, HStack, Text, Badge, Box, Spinner, useToast, Icon
} from '@chakra-ui/react';
import { FiCheck, FiUser, FiPhone, FiMail } from 'react-icons/fi';

export default function MatchingModal({ isOpen, onClose, property, token }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && property) {
      fetchMatches();
    }
  }, [isOpen, property]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`https://saas-immo.onrender.com/api/properties/${property.id}/matches`, config);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error("Erreur récupération matches:", error);
      toast({ title: "Erreur", description: "Impossible de récupérer les matchs.", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const createTaskForMatch = async (contact) => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.post('https://saas-immo.onrender.com/api/tasks', {
        title: `Contacter ${contact.firstName} ${contact.lastName} pour ${property.address}`,
        description: `Ce client recherche un bien correspondant aux critères de ${property.address} (${property.city}, ${property.price.toLocaleString()}€).`,
        priority: 'HIGH',
        status: 'TODO',
        contactId: contact.id
      }, config);

      toast({
        title: "Tâche créée !",
        description: `Une tâche a été créée pour contacter ${contact.firstName} ${contact.lastName}.`,
        status: "success",
        duration: 3000
      });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer la tâche.", status: "error" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiCheck} color="green.500" />
            <Text>Matching Automatique</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="purple.500" />
              <Text mt={4} color="gray.600">Recherche d'acheteurs potentiels...</Text>
            </Box>
          ) : matches.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" fontWeight="bold" color="gray.600">Aucun match trouvé</Text>
              <Text mt={2} color="gray.500">Aucun acheteur ne correspond aux critères de ce bien pour le moment.</Text>
            </Box>
          ) : (
            <>
              <Text mb={4} fontWeight="bold" color="purple.600">
                🎯 {matches.length} acheteur{matches.length > 1 ? 's' : ''} potentiel{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''} !
              </Text>
              <Text fontSize="sm" mb={4} color="gray.600">
                Ces contacts recherchent un bien similaire à <strong>{property.address}</strong>
              </Text>

              <VStack spacing={3} align="stretch">
                {matches.map((contact) => (
                  <Box
                    key={contact.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="purple.200"
                    bg="purple.50"
                    _hover={{ bg: "purple.100", shadow: "md" }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Icon as={FiUser} color="purple.600" />
                        <Text fontWeight="bold" fontSize="lg">
                          {contact.firstName} {contact.lastName}
                        </Text>
                      </HStack>
                      <Badge colorScheme="green">Match</Badge>
                    </HStack>

                    <VStack align="stretch" spacing={1} fontSize="sm" color="gray.700">
                      {contact.email && (
                        <HStack>
                          <Icon as={FiMail} boxSize={4} />
                          <Text>{contact.email}</Text>
                        </HStack>
                      )}
                      {contact.phoneNumber && (
                        <HStack>
                          <Icon as={FiPhone} boxSize={4} />
                          <Text>{contact.phoneNumber}</Text>
                        </HStack>
                      )}

                      {/* Critères de recherche */}
                      <Box mt={2} pt={2} borderTopWidth="1px" borderColor="purple.200">
                        <Text fontSize="xs" fontWeight="bold" color="purple.600" mb={1}>
                          Recherche :
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {contact.budgetMin && contact.budgetMax && (
                            <Badge colorScheme="blue" fontSize="xs">
                              {contact.budgetMin.toLocaleString()}€ - {contact.budgetMax.toLocaleString()}€
                            </Badge>
                          )}
                          {contact.cityPreferences && (
                            <Badge colorScheme="teal" fontSize="xs">
                              {contact.cityPreferences}
                            </Badge>
                          )}
                          {contact.minBedrooms && (
                            <Badge colorScheme="orange" fontSize="xs">
                              {contact.minBedrooms}+ chambres
                            </Badge>
                          )}
                          {contact.minArea && (
                            <Badge colorScheme="pink" fontSize="xs">
                              {contact.minArea}+ m²
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    </VStack>

                    <Button
                      mt={3}
                      size="sm"
                      colorScheme="purple"
                      onClick={() => createTaskForMatch(contact)}
                      width="full"
                    >
                      Créer une tâche de rappel
                    </Button>
                  </Box>
                ))}
              </VStack>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Fermer</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
