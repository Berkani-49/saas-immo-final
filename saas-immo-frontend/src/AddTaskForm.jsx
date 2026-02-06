// Fichier : src/AddTaskForm.jsx (Version Sécurisée)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, useToast, Heading, HStack
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

export default function AddTaskForm({ token, onTaskAdded, contacts, properties }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
        toast({ title: "Le titre est obligatoire", status: "warning" });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // PRÉPARATION DES DONNÉES SÉCURISÉE
      const payload = {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        
        // On force la conversion en Entier (Base 10) ou on envoie null
        contactId: contactId ? parseInt(contactId, 10) : null,
        propertyId: propertyId ? parseInt(propertyId, 10) : null
      };

      const response = await axios.post('https://saas-immo.onrender.com/api/tasks', payload, config);
      
      const newTask = { 
        ...response.data, 
        contact: contacts.find(c => c.id === payload.contactId),
        property: properties.find(p => p.id === payload.propertyId)
      };

      onTaskAdded(newTask);
      
      setTitle('');
      setDueDate('');
      setContactId('');
      setPropertyId('');
      
      toast({ title: "Tâche ajoutée !", status: "success", duration: 2000 });

    } catch (error) {
      console.error("Erreur ajout tâche:", error);
      toast({ title: "Erreur", description: "Impossible d'ajouter la tâche.", status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" mb={6}>
      <Heading size="md" mb={4} color="white">Nouvelle Tâche</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>À faire</FormLabel>
            <Input 
              placeholder="Ex: Rappeler M. Dupont..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </FormControl>

          <HStack width="100%" alignItems="start" spacing={4} direction={{ base: 'column', md: 'row' }}>
             <FormControl>
                <FormLabel>Échéance</FormLabel>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
             </FormControl>

             <FormControl>
                <FormLabel>Lier à un contact</FormLabel>
                <Select placeholder="Aucun" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </Select>
             </FormControl>
          </HStack>
          
          <FormControl>
            <FormLabel>Lier à un bien</FormLabel>
            <Select placeholder="Aucun" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                {properties.map(p => (
                <option key={p.id} value={p.id}>{p.address} ({p.city})</option>
                ))}
            </Select>
          </FormControl>

          <Button leftIcon={<AddIcon />} type="submit" colorScheme="purple" width="full" isLoading={isSubmitting}>
            Ajouter la tâche
          </Button>
        </VStack>
      </form>
    </Box>
  );
}