// Fichier : src/pages/ContactDetail.jsx (Version Complète + Biens)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Button, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Input, Select, Flex, Spacer,
  VStack, useToast, Center, Container, Badge, SimpleGrid, HStack, IconButton
} from '@chakra-ui/react';
import { ArrowBackIcon, PhoneIcon } from '@chakra-ui/icons';
import ContactProperties from '../components/ContactProperties.jsx';
import SuiviPanel from '../components/SuiviPanel.jsx';
import { API_URL } from '../config';

const PHONE_PREFIXES = [
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+32', label: '🇧🇪 +32' },
  { code: '+41', label: '🇨🇭 +41' },
  { code: '+352', label: '🇱🇺 +352' },
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+213', label: '🇩🇿 +213' },
  { code: '+216', label: '🇹🇳 +216' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+31', label: '🇳🇱 +31' },
  { code: '+351', label: '🇵🇹 +351' },
  { code: '+1', label: '🇺🇸 +1' },
];

function parsePhone(phone) {
  if (!phone) return { prefix: '+33', local: '' };
  const sorted = [...PHONE_PREFIXES].sort((a, b) => b.code.length - a.code.length);
  for (const p of sorted) {
    if (phone.startsWith(p.code)) return { prefix: p.code, local: phone.slice(p.code.length).trim() };
  }
  return { prefix: '+33', local: phone };
}

export default function ContactDetail({ token }) {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mode Édition
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [phonePrefix, setPhonePrefix] = useState('+33');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Chargement ---
  useEffect(() => {
    if (!token) return;
    const fetchContact = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/api/contacts/${contactId}`, config);
        setContact(response.data);
        setEditFormData(response.data);
        const parsed = parsePhone(response.data.phoneNumber);
        setPhonePrefix(parsed.prefix);
        setPhoneLocal(parsed.local);
      } catch (err) {
        console.error("Erreur chargement:", err);
        setError("Impossible de charger ce contact.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId, token]);

  // --- Sauvegarde ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = { ...editFormData, phoneNumber: phonePrefix + phoneLocal };
      const response = await axios.put(`${API_URL}/api/contacts/${contactId}`, payload, config);

      setContact(response.data);
      setEditFormData(response.data);
      setIsEditing(false);
      toast({ title: "Contact mis à jour.", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Erreur sauvegarde", status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <Center h="50vh"><Spinner size="xl" color="blue.500" /></Center>;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (!contact) return <Text>Contact introuvable.</Text>;

  return (
    <Container maxW="container.md" py={8}>
      <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/contacts')} mb={6} variant="ghost">
        Retour aux contacts
      </Button>

      <Box p={8} shadow="lg" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" bg="white">
        <Flex mb={6} align="center">
          <Heading as="h2" size="lg" color="gray.800">
            {isEditing ? "Modifier le contact" : `${contact.firstName} ${contact.lastName}`}
          </Heading>
          <Spacer />
          {!isEditing && (
            <Button colorScheme="blue" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
        </Flex>

        {isEditing ? (
          // --- FORMULAIRE ---
          <form onSubmit={handleSave}>
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="full">
                <FormControl>
                    <FormLabel>Prénom</FormLabel>
                    <Input name="firstName" value={editFormData.firstName} onChange={handleChange} />
                </FormControl>
                <FormControl>
                    <FormLabel>Nom</FormLabel>
                    <Input name="lastName" value={editFormData.lastName} onChange={handleChange} />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input name="email" value={editFormData.email} onChange={handleChange} />
              </FormControl>
              
              <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <HStack spacing={0}>
                  <Select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    w="120px"
                    borderRightRadius={0}
                    flexShrink={0}
                  >
                    {PHONE_PREFIXES.map(p => (
                      <option key={p.code} value={p.code}>{p.label}</option>
                    ))}
                  </Select>
                  <Input
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    placeholder="6 12 34 56 78"
                    borderLeftRadius={0}
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select name="type" value={editFormData.type} onChange={handleChange}>
                  <option value="BUYER">Acheteur</option>
                  <option value="SELLER">Vendeur</option>
                </Select>
              </FormControl>

              <Flex w="full" gap={4} mt={4}>
                <Button onClick={() => setIsEditing(false)} variant="ghost" flex={1}>Annuler</Button>
                <Button type="submit" colorScheme="green" isLoading={isSaving} flex={1}>Enregistrer</Button>
              </Flex>
            </VStack>
          </form>
        ) : (
          // --- VUE ---
          <VStack align="start" spacing={6}>
            <Box w="full" p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" color="gray.400" fontSize="xs" mb={1}>EMAIL</Text>
                <Text fontSize="lg" color="gray.800">{contact.email || "Non renseigné"}</Text>
            </Box>
            <Box w="full" p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" color="gray.400" fontSize="xs" mb={1}>TÉLÉPHONE</Text>
                <Flex align="center" justify="space-between">
                    <Text fontSize="lg" color="gray.800">{contact.phoneNumber || "Non renseigné"}</Text>
                    {contact.phoneNumber && (
                        <a href={`tel:${contact.phoneNumber}`}>
                            <IconButton
                                icon={<PhoneIcon />}
                                colorScheme="green"
                                variant="solid"
                                size="sm"
                                borderRadius="full"
                                aria-label="Appeler"
                            />
                        </a>
                    )}
                </Flex>
            </Box>
            <Box w="full" p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" color="gray.400" fontSize="xs" mb={1}>TYPE</Text>
                <Badge colorScheme={contact.type === 'BUYER' ? 'blue' : 'green'} fontSize="md" px={3} py={1} borderRadius="full">
                    {contact.type === 'BUYER' ? 'Acheteur' : 'Vendeur'}
                </Badge>
            </Box>

            {/* BIENS POSSÉDÉS */}
            <Box w="full" p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.300">
                <ContactProperties contactId={contact.id} token={token} />
            </Box>

            {/* SUIVI COMMERCIAL (acheteurs uniquement) */}
            {contact.type === 'BUYER' && (
              <Box w="full" p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.300">
                <SuiviPanel contactId={contact.id} token={token} />
              </Box>
            )}
          </VStack>
        )}
      </Box>
    </Container>
  );
}