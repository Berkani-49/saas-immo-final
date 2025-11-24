// Fichier : src/ContactItem.jsx (Version Corrigée - Import Button ajouté)

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Box, Text, IconButton, Flex, Badge, Spacer,
  FormControl, FormLabel, Input, Select,
  useToast, VStack, HStack, Icon, Avatar, Button // <--- J'AI AJOUTÉ 'Button' ICI
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { FaUserTie } from 'react-icons/fa';

export default function ContactItem({ contact, token, onContactDeleted, onContactUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...contact });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // --- Suppression ---
  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce contact ?")) return;
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://api-immo-final.onrender.com/api/contacts/${contact.id}`, config);
      onContactDeleted(contact.id);
      toast({ title: "Contact supprimé.", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Erreur", status: "error" });
      setIsLoading(false);
    }
  };

  // --- Modification ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.put(`https://api-immo-final.onrender.com/api/contacts/${contact.id}`, editData, config);
      onContactUpdated(response.data);
      setIsEditing(false);
      toast({ title: "Contact mis à jour.", status: "success" });
    } catch (err) {
      toast({ title: "Erreur", status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(current => ({ ...current, [name]: value }));
  };

  // --- MODE ÉDITION ---
  if (isEditing) {
    return (
      <Box p={5} borderWidth={1} borderRadius="xl" bg="white" shadow="md">
        <form onSubmit={handleSave}>
          <VStack spacing={3}>
            <HStack w="full">
                <Input size="sm" name="firstName" value={editData.firstName} onChange={handleChange} placeholder="Prénom" />
                <Input size="sm" name="lastName" value={editData.lastName} onChange={handleChange} placeholder="Nom" />
            </HStack>
            <Input size="sm" name="email" value={editData.email} onChange={handleChange} placeholder="Email" />
            <Input size="sm" name="phoneNumber" value={editData.phoneNumber} onChange={handleChange} placeholder="Téléphone" />
            <Select size="sm" name="type" value={editData.type} onChange={handleChange}>
              <option value="BUYER">Acheteur</option>
              <option value="SELLER">Vendeur</option>
            </Select>
            <Flex w="full" justify="flex-end" gap={2} mt={2}>
                <Button size="xs" variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
                <Button type="submit" size="xs" colorScheme="green" isLoading={isLoading}>Sauvegarder</Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    );
  }

  // --- MODE CARTE ---
  return (
    <Box 
      p={6} 
      borderWidth="1px" 
      borderRadius="2xl" 
      bg="white" 
      shadow="sm" 
      transition="all 0.2s"
      _hover={{ shadow: "lg", transform: "translateY(-2px)", borderColor: "blue.200" }}
      position="relative"
    >
      {/* En-tête avec Avatar */}
      <Flex align="center" mb={4}>
        <Avatar icon={<FaUserTie fontSize="1.2rem" />} bg={contact.type === 'BUYER' ? 'blue.500' : 'green.500'} color="white" mr={4} />
        <Box>
            <Link to={`/contact/${contact.id}`}>
                <Text fontWeight="bold" fontSize="lg" _hover={{ color: 'blue.500', textDecoration: 'underline' }}>
                    {contact.firstName} {contact.lastName}
                </Text>
            </Link>
            <Badge colorScheme={contact.type === 'BUYER' ? 'blue' : 'green'} variant="subtle" borderRadius="full" px={2}>
                {contact.type === 'BUYER' ? 'Acheteur' : 'Vendeur'}
            </Badge>
        </Box>
      </Flex>

      {/* Coordonnées */}
      <VStack align="start" spacing={2} mb={6} color="gray.600" fontSize="sm">
        <Flex align="center">
            <EmailIcon mr={2} color="gray.400" />
            <Text>{contact.email || "Pas d'email"}</Text>
        </Flex>
        <Flex align="center">
            <PhoneIcon mr={2} color="gray.400" />
            <Text>{contact.phoneNumber || "Pas de numéro"}</Text>
        </Flex>
      </VStack>

      {/* Boutons d'action */}
      <Flex justify="flex-end" pt={4} borderTopWidth={1} borderColor="gray.100">
        <IconButton icon={<EditIcon />} size="sm" variant="ghost" colorScheme="blue" onClick={() => setIsEditing(true)} aria-label="Modifier" mr={1} />
        <IconButton icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={isLoading} aria-label="Supprimer" />
      </Flex>
    </Box>
  );
}