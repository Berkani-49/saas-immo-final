// Fichier: src/pages/SecretRegister.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, AlertIcon, VStack, HStack, Code, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function SecretRegister({ token }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [emailSent, setEmailSent] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setTempPassword('');
    setEmailSent(null);
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/api/employees`, {
        firstName,
        lastName,
        email
      }, config);

      setEmailSent(response.data.emailSent);
      setMessage(response.data.message);
      if (!response.data.emailSent && response.data.temporaryPassword) {
        setTempPassword(response.data.temporaryPassword);
      } else {
        setTimeout(() => navigate('/equipe'), 3000);
      }

    } catch (error) {
      console.error('Échec inscription:', error);
      setMessage(`Erreur : ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxWidth="500px" margin="40px auto" p={8} borderWidth={1} borderColor="gray.200" borderRadius="2xl" boxShadow="xl" bg="white">
      <Heading as="h2" size="lg" mb={6} textAlign="center" color="brand.500">
        Ajouter un Collaborateur
      </Heading>
      
      {message && (
        <Alert status={message.startsWith('Erreur') ? 'error' : 'success'} mb={4} borderRadius="md" flexDirection="column" alignItems="flex-start">
          <HStack mb={tempPassword ? 2 : 0}>
            <AlertIcon />
            <Text>{message}</Text>
          </HStack>
          {tempPassword && (
            <Box mt={3} p={3} bg="orange.50" borderRadius="md" borderWidth="1px" borderColor="orange.200" w="full">
              <Text fontSize="sm" fontWeight="bold" color="orange.700" mb={2}>
                ⚠️ Transmettez ces identifiants manuellement à {firstName} :
              </Text>
              <Text fontSize="sm" color="gray.700"><strong>Email :</strong> {email}</Text>
              <Text fontSize="sm" color="gray.700" mt={1}>
                <strong>Mot de passe :</strong>{' '}
                <Code colorScheme="orange" fontSize="sm">{tempPassword}</Code>
              </Text>
              <Button mt={3} size="sm" colorScheme="brand" onClick={() => navigate('/equipe')}>
                Retour à l'équipe
              </Button>
            </Box>
          )}
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