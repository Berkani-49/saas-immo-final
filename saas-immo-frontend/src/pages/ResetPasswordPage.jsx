import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Flex, Heading, Text, FormControl, Input, Button, Alert, AlertIcon,
  VStack, HStack, Icon, List, ListItem, ListIcon
} from '@chakra-ui/react';
import { FiArrowLeft, FiLock, FiCheck, FiX } from 'react-icons/fi';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = [
    { label: '12 caractères minimum', valid: password.length >= 12 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Une minuscule', valid: /[a-z]/.test(password) },
    { label: 'Un chiffre', valid: /\d/.test(password) },
    { label: 'Un caractère spécial (@$!%*?&)', valid: /[@$!%*?&]/.test(password) },
  ];

  const isPasswordValid = passwordChecks.every(c => c.valid);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch) return;

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, email, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur serveur. Réessayez plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <Flex position="fixed" top="0" left="0" w="100vw" h="100vh" bg="gray.50" zIndex="9999" direction="column" justify="center" align="center" p={5}>
        <Box w="100%" maxW="420px" bg="white" p={8} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="lg">
          <Alert status="error" borderRadius="xl" bg="red.50" color="red.700">
            <AlertIcon color="red.400" />
            <Text fontSize="sm">Lien invalide. Veuillez refaire une demande de réinitialisation.</Text>
          </Alert>
          <Button as={RouterLink} to="/" mt={4} w="100%" colorScheme="brand" borderRadius="xl">
            Retour à la connexion
          </Button>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      position="fixed"
      top="0" left="0"
      w="100vw" h="100vh"
      bg="gray.50"
      zIndex="9999"
      direction="column"
      justify="center"
      align="center"
      p={5}
    >
      <Box w="100%" maxW="420px" bg="white" p={8} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="lg">
        <HStack as={RouterLink} to="/" spacing={2} mb={6} color="brand.500" _hover={{ textDecoration: 'underline' }}>
          <Icon as={FiArrowLeft} />
          <Text fontSize="sm">Retour à la connexion</Text>
        </HStack>

        <HStack spacing={3} mb={2}>
          <Icon as={FiLock} color="brand.500" boxSize={6} />
          <Heading as="h2" fontSize="xl" color="gray.800">Nouveau mot de passe</Heading>
        </HStack>
        <Text color="gray.600" mb={6} fontSize="sm">
          Choisissez un nouveau mot de passe sécurisé.
        </Text>

        {success ? (
          <VStack spacing={4}>
            <Alert status="success" borderRadius="xl" bg="green.50" color="green.700">
              <AlertIcon color="green.500" />
              <Text fontSize="sm">Mot de passe réinitialisé avec succès !</Text>
            </Alert>
            <Button as={RouterLink} to="/" w="100%" colorScheme="brand" borderRadius="xl">
              Se connecter
            </Button>
          </VStack>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  size="lg"
                  bg="white"
                  borderColor="gray.300"
                  color="gray.800"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  borderRadius="xl"
                />
              </FormControl>

              {password.length > 0 && (
                <List spacing={1} w="100%" fontSize="xs">
                  {passwordChecks.map((check, i) => (
                    <ListItem key={i} color={check.valid ? 'green.600' : 'gray.500'}>
                      <ListIcon as={check.valid ? FiCheck : FiX} color={check.valid ? 'green.500' : 'red.400'} />
                      {check.label}
                    </ListItem>
                  ))}
                </List>
              )}

              <FormControl isRequired>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  size="lg"
                  bg="white"
                  borderColor={confirmPassword.length > 0 ? (passwordsMatch ? 'green.500' : 'red.500') : 'gray.300'}
                  color="gray.800"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  borderRadius="xl"
                />
              </FormControl>

              {error && (
                <Alert status="error" borderRadius="xl" bg="red.50" color="red.700" py={2} fontSize="sm">
                  <AlertIcon color="red.400" boxSize={4} />
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                width="full"
                colorScheme="brand"
                isLoading={isSubmitting}
                isDisabled={!isPasswordValid || !passwordsMatch}
                loadingText="Réinitialisation..."
                borderRadius="xl"
                fontWeight="semibold"
              >
                Réinitialiser le mot de passe
              </Button>
            </VStack>
          </form>
        )}
      </Box>
    </Flex>
  );
}
