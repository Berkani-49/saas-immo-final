// Fichier : src/pages/LoginPage.jsx (Design Moderne Style Apple)
import React from 'react';
import {
  Box, Flex, Heading, Text, FormControl, Input, Button, Alert, AlertIcon,
  VStack, HStack, Spinner, Icon, useBreakpointValue
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { FiHome, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function LoginPage({
  email, setEmail,
  password, setPassword,
  handleLogin,
  message,
  isLoggingIn,
  backendStatus
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex
      position="fixed"
      top="0" left="0"
      w="100vw" h="100vh"
      bg="gray.900"
      zIndex="9999"
      direction={{ base: 'column', lg: 'row' }}
    >
      {/* Section gauche - Branding & Message */}
      <Flex
        flex={{ base: 'none', lg: '1.2' }}
        direction="column"
        justify="center"
        align={{ base: 'center', lg: 'flex-start' }}
        p={{ base: 8, md: 12, lg: 16 }}
        bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)"
        minH={{ base: '40vh', lg: '100vh' }}
      >
        {/* Logo */}
        <HStack spacing={2} mb={{ base: 6, lg: 10 }}>
          <Box
            w="10px" h="10px"
            borderRadius="full"
            bg="brand.400"
          />
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="bold"
            color="white"
            letterSpacing="tight"
          >
            IMMO<Text as="span" color="brand.400">FLOW</Text>
          </Text>
        </HStack>

        {/* Titre principal */}
        <Heading
          as="h1"
          fontSize={{ base: '2xl', md: '4xl', lg: '5xl', xl: '6xl' }}
          fontWeight="bold"
          color="white"
          lineHeight="1.1"
          mb={6}
          textAlign={{ base: 'center', lg: 'left' }}
        >
          Gérez vos biens,
          <br />
          <Text as="span" color="brand.400">
            connectez
          </Text>{' '}
          vos clients.
        </Heading>

        {/* Sous-titre */}
        <Text
          fontSize={{ base: 'md', md: 'lg' }}
          color="gray.300"
          maxW="500px"
          mb={8}
          textAlign={{ base: 'center', lg: 'left' }}
        >
          La plateforme tout-en-un pour les professionnels de l'immobilier.
          Simple, rapide, efficace.
        </Text>

        {/* Features highlights - Desktop only */}
        {!isMobile && (
          <VStack align="flex-start" spacing={4} mt={4}>
            <HStack spacing={3}>
              <Flex
                w="40px" h="40px"
                borderRadius="lg"
                bg="whiteAlpha.100"
                align="center"
                justify="center"
              >
                <Icon as={FiHome} color="brand.400" boxSize={5} />
              </Flex>
              <Text color="gray.300" fontSize="sm">Gestion complète de vos biens</Text>
            </HStack>
            <HStack spacing={3}>
              <Flex
                w="40px" h="40px"
                borderRadius="lg"
                bg="whiteAlpha.100"
                align="center"
                justify="center"
              >
                <Icon as={FiUsers} color="brand.400" boxSize={5} />
              </Flex>
              <Text color="gray.300" fontSize="sm">Suivi client intelligent</Text>
            </HStack>
            <HStack spacing={3}>
              <Flex
                w="40px" h="40px"
                borderRadius="lg"
                bg="whiteAlpha.100"
                align="center"
                justify="center"
              >
                <Icon as={FiTrendingUp} color="brand.400" boxSize={5} />
              </Flex>
              <Text color="gray.300" fontSize="sm">Analytics en temps réel</Text>
            </HStack>
          </VStack>
        )}
      </Flex>

      {/* Section droite - Formulaire */}
      <Flex
        flex="1"
        direction="column"
        justify="center"
        align="center"
        p={{ base: 6, md: 12 }}
        bg="gray.900"
      >
        <Box w="100%" maxW="400px">
          {/* Titre du formulaire */}
          <Heading
            as="h2"
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="semibold"
            color="white"
            mb={2}
          >
            Connexion
          </Heading>
          <Text color="gray.400" mb={8}>
            Accédez à votre espace agence
          </Text>

          {/* Indicateur de statut du backend */}
          <HStack mb={6} fontSize="sm">
            {backendStatus === 'checking' && (
              <>
                <Spinner size="xs" color="orange.400" />
                <Text color="orange.400">Connexion au serveur...</Text>
              </>
            )}
            {backendStatus === 'waking' && (
              <>
                <Spinner size="xs" color="orange.400" />
                <Text color="orange.400">Réveil du serveur...</Text>
              </>
            )}
            {backendStatus === 'ready' && (
              <>
                <CheckCircleIcon color="green.400" />
                <Text color="green.400">Serveur prêt</Text>
              </>
            )}
          </HStack>

          {/* Formulaire */}
          <form onSubmit={handleLogin}>
            <VStack spacing={5}>
              <FormControl id="email-login" isRequired>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  size="lg"
                  bg="gray.800"
                  border="1px solid"
                  borderColor="gray.700"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ borderColor: 'gray.600' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                  }}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl id="password-login" isRequired>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  size="lg"
                  bg="gray.800"
                  border="1px solid"
                  borderColor="gray.700"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ borderColor: 'gray.600' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                  }}
                  borderRadius="xl"
                />
              </FormControl>

              {message && (
                <Alert status="error" borderRadius="xl" bg="red.900" color="white">
                  <AlertIcon color="red.300" />
                  {message}
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                width="full"
                bg="brand.500"
                color="white"
                _hover={{ bg: 'brand.600', transform: 'translateY(-1px)' }}
                _active={{ bg: 'brand.700', transform: 'translateY(0)' }}
                isLoading={isLoggingIn}
                isDisabled={backendStatus !== 'ready'}
                loadingText="Connexion..."
                borderRadius="xl"
                fontWeight="semibold"
                transition="all 0.2s"
                boxShadow="0 4px 14px 0 rgba(99, 102, 241, 0.39)"
              >
                Se connecter
              </Button>
            </VStack>
          </form>

          {/* Footer */}
          <Text color="gray.500" fontSize="xs" textAlign="center" mt={10}>
            © 2025 ImmoFlow. Tous droits réservés.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
