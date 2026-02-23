import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Flex, Heading, Text, Button, Alert, AlertIcon, VStack, HStack, Icon, Spinner
} from '@chakra-ui/react';
import { FiCheckCircle, FiMail } from 'react-icons/fi';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'verifying' : 'no-token');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        await axios.get(`${API_URL}/api/auth/verify-email?token=${token}`);
        setStatus('verified');
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur de vérification.');
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Flex
      position="fixed"
      top="0" left="0"
      w="100vw" h="100vh"
      bg="#0a0a0f"
      zIndex="9999"
      direction="column"
      justify="center"
      align="center"
      p={5}
    >
      <Box w="100%" maxW="420px" bg="#13131a" p={8} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" textAlign="center">

        {status === 'verifying' && (
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.400" />
            <Heading fontSize="lg" color="gray.800">Vérification en cours...</Heading>
          </VStack>
        )}

        {status === 'verified' && (
          <VStack spacing={4}>
            <Icon as={FiCheckCircle} boxSize={12} color="green.400" />
            <Heading fontSize="xl" color="gray.800">Email vérifié !</Heading>
            <Text color="gray.400" fontSize="sm">Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.</Text>
            <Button as={RouterLink} to="/" w="100%" bg="brand.500" color="white" _hover={{ bg: 'brand.600' }} borderRadius="xl" size="lg">
              Se connecter
            </Button>
          </VStack>
        )}

        {status === 'error' && (
          <VStack spacing={4}>
            <Alert status="error" borderRadius="xl" bg="red.900" color="white">
              <AlertIcon color="red.300" />
              <Text fontSize="sm">{error}</Text>
            </Alert>
            <Button as={RouterLink} to="/" w="100%" colorScheme="blue" borderRadius="xl">
              Retour à la connexion
            </Button>
          </VStack>
        )}

        {status === 'no-token' && (
          <VStack spacing={4}>
            <Icon as={FiMail} boxSize={12} color="brand.400" />
            <Heading fontSize="xl" color="gray.800">Vérifiez votre email</Heading>
            <Text color="gray.400" fontSize="sm">
              Un email de vérification a été envoyé à votre adresse. Cliquez sur le lien dans l'email pour activer votre compte.
            </Text>
            <Button as={RouterLink} to="/" w="100%" variant="outline" colorScheme="blue" borderRadius="xl">
              Retour à la connexion
            </Button>
          </VStack>
        )}
      </Box>
    </Flex>
  );
}
