// Fichier: src/pages/SecretRegister.jsx (Version Sécurisée)

import React, { useState } from 'react';
import axios from 'axios';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, AlertIcon, VStack, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

// On reçoit le token car on est connecté
export default function SecretRegister({ token }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      // On envoie le Token pour prouver qu'on est admin
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      await axios.post('https://saas-immo-final.onrender.com/api/auth/register', {
        firstName, lastName, email, password
      }, config);
      
      setMessage('Agent créé avec succès !');
      // On retourne à la liste de l'équipe
      setTimeout(() => navigate('/equipe'), 1500);

    } catch (error) {
      console.error('Échec inscription:', error);
      setMessage(`Erreur : ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxWidth="500px" margin="40px auto" p={8} borderWidth={1} borderRadius="2xl" boxShadow="xl" bg="white">
      <Heading as="h2" size="lg" mb={6} textAlign="center" color="brand.500">
        Ajouter un Collaborateur
      </Heading>
      
      {message && (
        <Alert status={message.startsWith('Erreur') ? 'error' : 'success'} mb={4} borderRadius="md">
          <AlertIcon />{message}
        </Alert>
      )}

      <form onSubmit={handleRegister}>
        <VStack spacing={5}>
          <HStack width="full">
            <FormControl isRequired><FormLabel>Prénom</FormLabel><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></FormControl>
            <FormControl isRequired><FormLabel>Nom</FormLabel><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></FormControl>
          </HStack>
          <FormControl isRequired><FormLabel>Email Pro</FormLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormControl>
          <FormControl isRequired><FormLabel>Mot de passe initial</FormLabel><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ex: Agence2025!" /></FormControl>
          
          <Button type="submit" colorScheme="brand" width="full" size="lg" isLoading={isLoading}>
            Créer le compte
          </Button>
        </VStack>
      </form>
    </Box>
  );
}