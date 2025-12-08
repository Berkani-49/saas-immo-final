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
  const [selectedType, setSelectedType] = useState('OWNER'); // Type par défaut
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
        { contactId: selectedContactId, type: selectedType },
        config
      );
      const label = selectedType === 'OWNER' ? 'Propriétaire ajouté !' : 'Contact intéressé ajouté !';
      toast({ title: label, status: "success", duration: 2000 });
      fetchOwners();
      setSelectedContactId('');
      setSelectedType('OWNER');
    } catch (err) {
      toast({ title: "Erreur", description: err.response?.data?.error || "Impossible d'ajouter", status: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveOwner = async (contactId, relationType) => {
    try {
      // On passe le type en query param pour supprimer uniquement cette relation
      await axios.delete(`https://saas-immo.onrender.com/api/properties/${propertyId}/owners/${contactId}?type=${relationType}`, config);
      const label = relationType === 'OWNER' ? 'Propriétaire retiré' : 'Contact intéressé retiré';
      toast({ title: label, status: "info", duration: 2000 });
      fetchOwners();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de retirer", status: "error" });
    }
  };

  if (isLoading) return <Spinner size="sm" />;

  return (
    <Box>
      <Heading size="sm" mb={3}>Contacts liés ({owners.length})</Heading>

      {/* Liste des propriétaires et intéressés */}
      <VStack align="stretch" spacing={2} mb={4}>
        {owners.length === 0 ? (
          <Text fontSize="sm" color="gray.500">Aucun contact associé</Text>
        ) : (
          owners.map(owner => (
            <HStack key={`${owner.id}-${owner.relationType}`} justify="space-between" p={2}
              bg={owner.relationType === 'OWNER' ? 'blue.50' : 'green.50'} borderRadius="md">
              <HStack>
                <Badge colorScheme={owner.relationType === 'OWNER' ? 'blue' : 'green'}>
                  {owner.relationType === 'OWNER' ? 'Propriétaire' : 'Intéressé'}
                </Badge>
                <Text fontWeight="medium">{owner.firstName} {owner.lastName}</Text>
              </HStack>
              <IconButton
                icon={<MdDelete />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleRemoveOwner(owner.id, owner.relationType)}
                aria-label="Retirer"
              />
            </HStack>
          ))
        )}
      </VStack>

      {/* Formulaire d'ajout */}
      <VStack align="stretch" spacing={2}>
        <HStack>
          <Select
            placeholder="Choisir un contact"
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            size="sm"
            flex={2}
          >
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
          </Select>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            size="sm"
            flex={1}
          >
            <option value="OWNER">Propriétaire</option>
            <option value="INTERESTED">Intéressé</option>
          </Select>
        </HStack>
        <Button
          leftIcon={<MdAdd />}
          size="sm"
          colorScheme="blue"
          onClick={handleAddOwner}
          isLoading={isAdding}
          isDisabled={!selectedContactId}
          width="full"
        >
          Ajouter le contact
        </Button>
      </VStack>
    </Box>
  );
}
