import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Flex, Heading, Text, FormControl, Input, Button, Alert, AlertIcon,
  VStack, HStack, Icon
} from '@chakra-ui/react';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { API_URL } from '../config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur serveur. Réessayez plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <Box w="100%" maxW="420px" bg="#13131a" p={8} borderRadius="2xl" borderWidth="1px" borderColor="gray.700">
        <HStack as={RouterLink} to="/" spacing={2} mb={6} color="brand.400" _hover={{ textDecoration: 'underline' }}>
          <Icon as={FiArrowLeft} />
          <Text fontSize="sm">Retour à la connexion</Text>
        </HStack>

        <HStack spacing={3} mb={2}>
          <Icon as={FiMail} color="brand.400" boxSize={6} />
          <Heading as="h2" fontSize="xl" color="white">Mot de passe oublié</Heading>
        </HStack>
        <Text color="gray.400" mb={6} fontSize="sm">
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
        </Text>

        {sent ? (
          <Alert status="success" borderRadius="xl" bg="green.900" color="white">
            <AlertIcon color="green.300" />
            <Text fontSize="sm">Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.</Text>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  size="lg"
                  bg="#1a1a24"
                  border="1px solid"
                  borderColor="gray.700"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  borderRadius="xl"
                />
              </FormControl>

              {error && (
                <Alert status="error" borderRadius="xl" bg="red.900" color="white" py={2} fontSize="sm">
                  <AlertIcon color="red.300" boxSize={4} />
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                width="full"
                bg="brand.500"
                color="white"
                _hover={{ bg: 'brand.600' }}
                isLoading={isSubmitting}
                loadingText="Envoi..."
                borderRadius="xl"
                fontWeight="semibold"
              >
                Envoyer le lien
              </Button>
            </VStack>
          </form>
        )}
      </Box>
    </Flex>
  );
}
