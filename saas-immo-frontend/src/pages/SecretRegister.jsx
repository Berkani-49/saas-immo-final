// Fichier: src/pages/SecretRegister.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, AlertIcon, VStack, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function SecretRegister() {
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
      // On utilise l'URL complète de Render pour être sûr
      await await axios.post('https://api-immo-final.onrender.com/api/auth/register', {
        firstName,
        lastName,
        email,
        password
      });
      
      setMessage('Compte créé avec succès ! Redirection...');
      setTimeout(() => navigate('/'), 2000); // Renvoie vers la page de connexion après 2s

    } catch (error) {
      console.error('Échec inscription:', error);
      setMessage(`Erreur : ${error.response?.data?.error || 'Une erreur est survenue.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxWidth="500px" margin="50px auto" p={6} borderWidth={1} borderRadius="lg" boxShadow="xl" bg="white">
      <Heading as="h2" size="lg" mb={6} textAlign="center" color="red.500">
        🤫 Inscription Staff
      </Heading>
      
      {message && (
        <Alert status={message.startsWith('Erreur') ? 'error' : 'success'} mb={4} borderRadius="md">
          <AlertIcon />
          {message}
        </Alert>
      )}

      <form onSubmit={handleRegister}>
        <VStack spacing={4}>
          <HStack width="full">
            <FormControl isRequired>
              <FormLabel>Prénom</FormLabel>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Nom</FormLabel>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </FormControl>
          </HStack>
          <FormControl isRequired>
            <FormLabel>Email Pro</FormLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Mot de passe</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormControl>
          <Button type="submit" colorScheme="red" width="full" isLoading={isLoading}>
            Créer l'accès agent
          </Button>
        </VStack>
      </form>
    </Box>
  );
}