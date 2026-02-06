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
      bg="#0a0a0f"
      zIndex="9999"
      direction={{ base: 'column', lg: 'row' }}
      overflow="auto"
    >
      {/* Section gauche - Branding & Message */}
      <Flex
        flex={{ base: 'none', lg: '1.2' }}
        direction="column"
        justify="center"
        align={{ base: 'center', lg: 'flex-start' }}
        p={{ base: 6, md: 12, lg: 16 }}
        bg={{ base: '#0d0d14', lg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)' }}
        minH={{ base: 'auto', lg: '100vh' }}
        py={{ base: 6, lg: 16 }}
      >
        {/* Logo */}
        <HStack spacing={2} mb={{ base: 4, lg: 10 }}>
          <Box
            w={{ base: '8px', md: '10px' }}
            h={{ base: '8px', md: '10px' }}
            borderRadius="full"
            bg="brand.400"
          />
          <Text
            fontSize={{ base: 'md', md: 'xl' }}
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
          fontSize={{ base: 'xl', md: '3xl', lg: '5xl', xl: '6xl' }}
          fontWeight="bold"
          color="white"
          lineHeight="1.2"
          mb={{ base: 3, lg: 6 }}
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
          fontSize={{ base: 'sm', md: 'lg' }}
          color="gray.300"
          maxW="500px"
          mb={{ base: 4, lg: 8 }}
          textAlign={{ base: 'center', lg: 'left' }}
        >
          La plateforme tout-en-un pour les professionnels de l'immobilier.
        </Text>

        {/* Features highlights - Mobile version compacte */}
        {isMobile ? (
          <HStack spacing={5} justify="center" flexWrap="wrap" mt={2}>
            <HStack spacing={2}>
              <Icon as={FiHome} color="brand.400" boxSize={4} />
              <Text color="gray.300" fontSize="xs" fontWeight="medium">Biens</Text>
            </HStack>
            <HStack spacing={2}>
              <Icon as={FiUsers} color="brand.400" boxSize={4} />
              <Text color="gray.300" fontSize="xs" fontWeight="medium">Clients</Text>
            </HStack>
            <HStack spacing={2}>
              <Icon as={FiTrendingUp} color="brand.400" boxSize={4} />
              <Text color="gray.300" fontSize="xs" fontWeight="medium">Analytics</Text>
            </HStack>
          </HStack>
        ) : (
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
        flex={{ base: '1', lg: '1' }}
        direction="column"
        justify={{ base: 'flex-start', lg: 'center' }}
        align="center"
        p={{ base: 5, md: 12 }}
        py={{ base: 6, lg: 12 }}
        bg={{ base: '#0a0a0f', lg: 'gray.900' }}
      >
        <Box
          w="100%"
          maxW="400px"
          bg={{ base: '#13131a', lg: 'transparent' }}
          p={{ base: 5, lg: 0 }}
          borderRadius={{ base: '2xl', lg: 'none' }}
          borderWidth={{ base: '1px', lg: '0' }}
          borderColor={{ base: 'gray.700', lg: 'transparent' }}
        >
          {/* Titre du formulaire */}
          <Heading
            as="h2"
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            color="white"
            mb={2}
          >
            Connexion
          </Heading>
          <Text color="gray.300" mb={6} fontSize={{ base: 'sm', md: 'md' }}>
            Accédez à votre espace agence
          </Text>

          {/* Indicateur de statut du backend */}
          <HStack mb={5} fontSize="sm" justify={{ base: 'center', lg: 'flex-start' }}>
            {backendStatus === 'checking' && (
              <>
                <Spinner size="xs" color="orange.400" />
                <Text color="orange.400" fontSize="xs">Connexion au serveur...</Text>
              </>
            )}
            {backendStatus === 'waking' && (
              <>
                <Spinner size="xs" color="orange.400" />
                <Text color="orange.400" fontSize="xs">Réveil du serveur...</Text>
              </>
            )}
            {backendStatus === 'ready' && (
              <>
                <CheckCircleIcon color="green.400" boxSize={3} />
                <Text color="green.400" fontSize="xs">Serveur prêt</Text>
              </>
            )}
          </HStack>

          {/* Formulaire */}
          <form onSubmit={handleLogin}>
            <VStack spacing={4}>
              <FormControl id="email-login" isRequired>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  size={{ base: 'lg', md: 'lg' }}
                  bg={{ base: '#1a1a24', lg: 'gray.800' }}
                  border="1px solid"
                  borderColor={{ base: 'gray.600', lg: 'gray.700' }}
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ borderColor: 'brand.400' }}
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
                  size={{ base: 'lg', md: 'lg' }}
                  bg={{ base: '#1a1a24', lg: 'gray.800' }}
                  border="1px solid"
                  borderColor={{ base: 'gray.600', lg: 'gray.700' }}
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ borderColor: 'brand.400' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                  }}
                  borderRadius="xl"
                />
              </FormControl>

              {message && (
                <Alert status="error" borderRadius="xl" bg="red.900" color="white" py={2} fontSize="sm">
                  <AlertIcon color="red.300" boxSize={4} />
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
                fontWeight="bold"
                fontSize={{ base: 'md', md: 'lg' }}
                transition="all 0.2s"
                boxShadow="0 4px 14px 0 rgba(99, 102, 241, 0.5)"
                mt={3}
                py={6}
              >
                Se connecter
              </Button>
            </VStack>
          </form>

          {/* Footer */}
          <Text color="gray.500" fontSize="xs" textAlign="center" mt={6}>
            © 2025 ImmoFlow. Tous droits réservés.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
