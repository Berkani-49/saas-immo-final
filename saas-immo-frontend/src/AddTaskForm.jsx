// Fichier : src/AddTaskForm.jsx

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, useToast, Heading, HStack
} from '@chakra-ui/react';

export default function AddTaskForm({ token, onTaskAdded, contacts, properties }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;
    
    setIsSubmitting(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      // On prépare les données
      const payload = {
        title,
        dueDate: dueDate || null,
        contactId: contactId ? parseInt(contactId) : null,
        propertyId: propertyId ? parseInt(propertyId) : null
      };

      const response = await axios.post('https://saas-immo-complet.onrender.com/api/tasks', payload, config);
      
      // On recharge la tâche avec les infos complètes (pour avoir les noms des contacts/biens)
      // Petite astuce : Le backend nous renvoie déjà l'objet créé, mais sans les relations incluses 
      // Pour faire simple, on va juste ajouter la nouvelle tâche à la liste
      // Idéalement il faudrait que le backend renvoie le include, mais on gérera ça.
      
      // On ajoute manuellement les objets liés pour l'affichage immédiat
      const newTask = { 
        ...response.data, 
        contact: contacts.find(c => c.id === parseInt(contactId)),
        property: properties.find(p => p.id === parseInt(propertyId))
      };

      onTaskAdded(newTask);
      
      // Reset form
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
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
      <Heading size="md" mb={4}>Nouvelle Tâche</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>À faire</FormLabel>
            <Input 
              placeholder="Ex: Rappeler M. Dupont pour la visite..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </FormControl>

          <HStack width="100%" alignItems="start">
             <FormControl>
                <FormLabel>Échéance</FormLabel>
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
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

          <Button type="submit" colorScheme="purple" width="full" isLoading={isSubmitting}>
            Ajouter la tâche
          </Button>
        </VStack>
      </form>
    </Box>
  );
}