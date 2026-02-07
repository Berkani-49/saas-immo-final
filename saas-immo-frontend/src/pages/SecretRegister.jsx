// Fichier: src/pages/SecretRegister.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, AlertIcon, VStack, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function SecretRegister({ token }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.post('https://saas-immo.onrender.com/api/employees', {
        firstName,
        lastName,
        email
      }, config);

      setMessage('Employé ajouté avec succès ! Un email avec les identifiants a été envoyé.');
      setTimeout(() => navigate('/equipe'), 2000);

    } catch (error) {
      console.error('Échec inscription:', error);
      setMessage(`Erreur : ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxWidth="500px" margin="40px auto" p={8} borderWidth={1} borderColor="gray.700" borderRadius="2xl" boxShadow="xl" bg="gray.800">
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
            <FormControl isRequired><FormLabel>Prénom</FormLabel><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} focusBorderColor="brand.500" /></FormControl>
            <FormControl isRequired><FormLabel>Nom</FormLabel><Input value={lastName} onChange={(e) => setLastName(e.target.value)} focusBorderColor="brand.500" /></FormControl>
          </HStack>
          <FormControl isRequired><FormLabel>Email Pro</FormLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} focusBorderColor="brand.500" /></FormControl>

          <Alert status="info" fontSize="sm" borderRadius="md">
            <AlertIcon />
            Un mot de passe sécurisé sera généré automatiquement et envoyé par email.
          </Alert>

          <Button type="submit" colorScheme="brand" width="full" size="lg" isLoading={isLoading}>
            Créer le compte
          </Button>
        </VStack>
      </form>
    </Box>
  );
}