// Fichier : src/Sidebar.jsx (Design Pro avec Icônes)
import { FiHome, FiList, FiUsers, FiCheckSquare, FiTrendingUp, FiLogOut, FiFileText } from 'react-icons/fi';
import React from 'react';
import { Box, VStack, Button, Heading, Spacer, CloseButton, Flex, Icon, Text, Divider } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { FiHome, FiList, FiUsers, FiCheckSquare, FiTrendingUp, FiLogOut } from 'react-icons/fi'; // Icônes modernes

// Liste des liens pour le menu (plus facile à gérer)
const LinkItems = [
  { name: 'Accueil', icon: FiHome, path: '/' },
  { name: 'Mes Biens', icon: FiList, path: '/biens' },
  { name: 'Mes Contacts', icon: FiUsers, path: '/contacts' },
  { name: 'Mes Tâches', icon: FiCheckSquare, path: '/taches' },
  { name: 'Factures', icon: FiFileText, path: '/factures' },
  { name: 'Estimer', icon: FiTrendingUp, path: '/estimate' },
];

export default function Sidebar({ onLogout, onClose }) {
  
  const NavItem = ({ icon, children, to, ...rest }) => (
    <RouterNavLink to={to} onClick={onClose} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Flex
          align="center"
          p="4"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          bg={isActive ? 'blue.500' : 'transparent'} // Fond bleu si actif
          color={isActive ? 'white' : 'gray.400'}    // Texte blanc si actif
          _hover={{
            bg: isActive ? 'blue.600' : 'gray.700',
            color: 'white',
          }}
          transition="all 0.2s"
          {...rest}
        >
          {icon && (
            <Icon
              mr="4"
              fontSize="16"
              as={icon}
              _groupHover={{ color: 'white' }}
            />
          )}
          <Text fontSize="sm" fontWeight="medium">{children}</Text>
        </Flex>
      )}
    </RouterNavLink>
  );

  return (
    <Box
      bg="gray.900" // Noir/Gris très profond
      color="white"
      h="100vh"
      w="100%"
      pos="relative"
      display="flex"
      flexDirection="column"
      borderRight="1px"
      borderRightColor="gray.700"
    >
      {/* En-tête du menu */}
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Heading fontSize="xl" fontWeight="bold" letterSpacing="tight">
          IMMO<Text as="span" color="blue.400">PRO</Text>
        </Heading>
        {onClose && <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />}
      </Flex>

      <Divider borderColor="gray.700" mb={4} />

      {/* Les Liens */}
      <VStack align="stretch" spacing={1}>
        {LinkItems.map((link) => (
          <NavItem key={link.name} icon={link.icon} to={link.path}>
            {link.name}
          </NavItem>
        ))}
      </VStack>

      <Spacer />

      {/* Bouton Déconnexion (en bas) */}
      <Box p={6}>
        <Button 
          onClick={onLogout} 
          width="full" 
          variant="outline" 
          colorScheme="red" 
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{ bg: 'red.500', color: 'white', borderColor: 'red.500' }}
        >
          Déconnexion
        </Button>
      </Box>
    </Box>
  );
}