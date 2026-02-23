// Composant : MatchingModal - Affiche les acheteurs matchés avec un bien (Version améliorée avec scoring)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, Button, VStack, HStack, Text, Badge, Box, Spinner, useToast, Icon,
  Progress, Tooltip, List, ListItem, ListIcon
} from '@chakra-ui/react';
import { FiCheck, FiUser, FiPhone, FiMail, FiAlertCircle, FiCheckCircle, FiXCircle, FiTarget } from 'react-icons/fi';
import { API_URL } from '../config';

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
      const response = await axios.get(`${API_URL}/api/properties/${property.id}/matches`, config);
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
      await axios.post(`${API_URL}/api/tasks`, {
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
              <Text mt={4} color="gray.400">Recherche d'acheteurs potentiels...</Text>
            </Box>
          ) : matches.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" fontWeight="bold" color="gray.400">Aucun match trouvé</Text>
              <Text mt={2} color="gray.500">Aucun acheteur ne correspond aux critères de ce bien pour le moment.</Text>
            </Box>
          ) : (
            <>
              <Text mb={4} fontWeight="bold" color="purple.300">
                🎯 {matches.length} acheteur{matches.length > 1 ? 's' : ''} potentiel{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''} !
              </Text>
              <Text fontSize="sm" mb={4} color="gray.400">
                Ces contacts recherchent un bien similaire à <strong>{property.address}</strong>
              </Text>

              <VStack spacing={3} align="stretch">
                {matches.map((contact) => {
                  // Déterminer la couleur en fonction du score
                  const getScoreColor = (score) => {
                    if (score >= 90) return 'green';
                    if (score >= 70) return 'blue';
                    if (score >= 50) return 'orange';
                    return 'gray';
                  };

                  const scoreColor = getScoreColor(contact.matchScore);

                  return (
                    <Box
                      key={contact.id}
                      p={4}
                      borderWidth="2px"
                      borderRadius="lg"
                      borderColor={`${scoreColor}.300`}
                      bg="gray.50"
                      shadow="md"
                      _hover={{ shadow: "xl", transform: "translateY(-2px)" }}
                      transition="all 0.2s"
                    >
                      {/* Header avec nom et score */}
                      <HStack justify="space-between" mb={3}>
                        <HStack>
                          <Icon as={FiUser} color={`${scoreColor}.600`} boxSize={5} />
                          <Text fontWeight="bold" fontSize="lg">
                            {contact.firstName} {contact.lastName}
                          </Text>
                        </HStack>
                        <Tooltip label={`Score de compatibilité : ${contact.matchScore}/100`}>
                          <Badge
                            colorScheme={scoreColor}
                            fontSize="md"
                            px={3}
                            py={1}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            <Icon as={FiTarget} />
                            {contact.matchScore}%
                          </Badge>
                        </Tooltip>
                      </HStack>

                      {/* Barre de progression du score */}
                      <Progress
                        value={contact.matchScore}
                        colorScheme={scoreColor}
                        size="sm"
                        borderRadius="full"
                        mb={3}
                      />

                      {/* Coordonnées */}
                      <VStack align="stretch" spacing={1} fontSize="sm" color="gray.600" mb={3}>
                        {contact.email && (
                          <HStack>
                            <Icon as={FiMail} boxSize={4} color="gray.500" />
                            <Text>{contact.email}</Text>
                          </HStack>
                        )}
                        {contact.phoneNumber && (
                          <HStack>
                            <Icon as={FiPhone} boxSize={4} color="gray.500" />
                            <Text>{contact.phoneNumber}</Text>
                          </HStack>
                        )}
                      </VStack>

                      {/* Détails du matching */}
                      {contact.matchDetails && contact.matchDetails.reasons && (
                        <Box
                          mt={2}
                          pt={3}
                          borderTopWidth="1px"
                          borderColor="gray.300"
                          bg="white"
                          p={3}
                          borderRadius="md"
                        >
                          <HStack mb={2}>
                            <Icon as={FiAlertCircle} color="purple.300" boxSize={4} />
                            <Text fontSize="xs" fontWeight="bold" color="purple.300">
                              Analyse de compatibilité :
                            </Text>
                          </HStack>
                          <List spacing={1}>
                            {contact.matchDetails.reasons.map((reason, idx) => {
                              const isSuccess = reason.startsWith('✅');
                              const isPartial = reason.startsWith('⚠️');

                              return (
                                <ListItem
                                  key={idx}
                                  fontSize="xs"
                                  color={isSuccess ? 'green.300' : isPartial ? 'orange.300' : 'red.300'}
                                  display="flex"
                                  alignItems="center"
                                  gap={2}
                                >
                                  <ListIcon
                                    as={isSuccess ? FiCheckCircle : isPartial ? FiAlertCircle : FiXCircle}
                                    color={isSuccess ? 'green.500' : isPartial ? 'orange.500' : 'red.500'}
                                  />
                                  {reason.substring(2)} {/* Enlever l'emoji */}
                                </ListItem>
                              );
                            })}
                          </List>
                        </Box>
                      )}

                      {/* Bouton d'action */}
                      <Button
                        mt={3}
                        size="sm"
                        colorScheme={scoreColor}
                        onClick={() => createTaskForMatch(contact)}
                        width="full"
                        leftIcon={<Icon as={FiCheck} />}
                      >
                        Créer une tâche de rappel
                      </Button>
                    </Box>
                  );
                })}
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
