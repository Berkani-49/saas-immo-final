// Fichier: src/components/PropertyOwners.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Button, Select, HStack, VStack, Text, Badge, IconButton, useToast, Spinner
} from '@chakra-ui/react';
import { MdDelete, MdAdd } from 'react-icons/md';

export default function PropertyOwners({ propertyId, token }) {
  const [owners, setOwners] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();

  const config = { headers: { 'Authorization': `Bearer ${token}` } };

  useEffect(() => {
    fetchOwners();
    fetchContacts();
  }, [propertyId]);

  const fetchOwners = async () => {
    try {
      const response = await axios.get(`https://saas-immo.onrender.com/api/properties/${propertyId}/owners`, config);
      setOwners(response.data);
    } catch (err) {
      console.error("Erreur chargement propriétaires:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get('https://saas-immo.onrender.com/api/contacts', config);
      setContacts(response.data);
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
    }
  };

  const handleAddOwner = async () => {
    if (!selectedContactId) return;
    setIsAdding(true);
    try {
      await axios.post(`https://saas-immo.onrender.com/api/properties/${propertyId}/owners`,
        { contactId: selectedContactId },
        config
      );
      toast({ title: "Propriétaire ajouté !", status: "success", duration: 2000 });
      fetchOwners();
      setSelectedContactId('');
    } catch (err) {
      toast({ title: "Erreur", description: err.response?.data?.error || "Impossible d'ajouter le propriétaire", status: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveOwner = async (contactId) => {
    try {
      await axios.delete(`https://saas-immo.onrender.com/api/properties/${propertyId}/owners/${contactId}`, config);
      toast({ title: "Propriétaire retiré", status: "info", duration: 2000 });
      fetchOwners();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de retirer le propriétaire", status: "error" });
    }
  };

  if (isLoading) return <Spinner size="sm" />;

  return (
    <Box>
      <Heading size="sm" mb={3}>Propriétaires ({owners.length})</Heading>

      {/* Liste des propriétaires */}
      <VStack align="stretch" spacing={2} mb={4}>
        {owners.length === 0 ? (
          <Text fontSize="sm" color="gray.500">Aucun propriétaire</Text>
        ) : (
          owners.map(owner => (
            <HStack key={owner.id} justify="space-between" p={2} bg="blue.50" borderRadius="md">
              <HStack>
                <Badge colorScheme="blue">{owner.type}</Badge>
                <Text fontWeight="medium">{owner.firstName} {owner.lastName}</Text>
              </HStack>
              <IconButton
                icon={<MdDelete />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleRemoveOwner(owner.id)}
                aria-label="Retirer propriétaire"
              />
            </HStack>
          ))
        )}
      </VStack>

      {/* Formulaire d'ajout */}
      <HStack>
        <Select
          placeholder="Choisir un contact"
          value={selectedContactId}
          onChange={(e) => setSelectedContactId(e.target.value)}
          size="sm"
        >
          {contacts
            .filter(c => !owners.find(o => o.id === c.id)) // Exclure ceux déjà propriétaires
            .map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
        </Select>
        <Button
          leftIcon={<MdAdd />}
          size="sm"
          colorScheme="blue"
          onClick={handleAddOwner}
          isLoading={isAdding}
          isDisabled={!selectedContactId}
        >
          Ajouter
        </Button>
      </HStack>
    </Box>
  );
}
