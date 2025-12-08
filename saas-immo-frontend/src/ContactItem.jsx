// Fichier : src/ContactItem.jsx (Version Simplifiée & Robuste)

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Box, Text, IconButton, Flex, Badge, VStack, Icon, Avatar, useToast
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { FaUserTie } from 'react-icons/fa';

export default function ContactItem({ contact, token, onContactDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // --- Suppression ---
  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce contact ?")) return;
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://saas-immo.onrender.com/api/contacts/${contact.id}`, config);
      onContactDeleted(contact.id);
      toast({ title: "Contact supprimé.", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Erreur suppression", status: "error" });
      setIsLoading(false);
    }
  };

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
        
        {/* BOUTON MODIFIER (Stylo) : Redirige vers la page détail */}
        <Link to={`/contact/${contact.id}`}>
            <IconButton 
                icon={<EditIcon />} 
                size="sm" 
                variant="ghost" 
                colorScheme="blue" 
                aria-label="Modifier" 
                mr={1} 
            />
        </Link>

        {/* BOUTON SUPPRIMER */}
        <IconButton 
            icon={<DeleteIcon />} 
            size="sm" 
            variant="ghost" 
            colorScheme="red" 
            onClick={handleDelete} 
            isLoading={isLoading} 
            aria-label="Supprimer" 
        />
      </Flex>
    </Box>
  );
}