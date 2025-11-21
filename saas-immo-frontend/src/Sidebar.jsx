// Fichier : src/Sidebar.jsx (Version Corrigée - Bouton visible)

import React from 'react';
import { Box, VStack, Button, Heading, Spacer, CloseButton, Flex } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';

const activeStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  boxShadow: 'inset 3px 0 0 0 white',
};

export default function Sidebar({ onLogout, onClose }) {
  
  const NavItem = ({ to, children, ...rest }) => (
    <RouterNavLink to={to} style={({ isActive }) => (isActive ? activeStyle : undefined)} onClick={onClose}>
      <Button
        variant="ghost"
        color="white"
        justifyContent="flex-start"
        width="100%"
        _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
        {...rest}
      >
        {children}
      </Button>
    </RouterNavLink>
  );

  return (
    <Box
      bg="gray.800"
      color="white"
      h="100vh"      /* Prend toute la hauteur */
      w="100%"
      position="relative"
      p={4}
      pb={24}        /* <--- AJOUT : Grosse marge en bas pour remonter le bouton */
      display="flex"
      flexDirection="column"
      overflowY="auto" /* <--- AJOUT : Permet de scroller si l'écran est trop petit */
    >
      <Flex alignItems="center" justifyContent="space-between" mb={8}>
        <Heading size="md">Mon Agence</Heading>
        {/* Bouton fermer uniquement sur mobile */}
        {onClose && <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />}
      </Flex>

      <VStack align="stretch" spacing={2}>
        <NavItem to="/" end>Accueil</NavItem>
        <NavItem to="/biens">Mes Biens</NavItem>
        <NavItem to="/contacts">Mes Contacts</NavItem>
        <NavItem to="/taches">Mes Tâches</NavItem>
        <NavItem to="/estimate">Estimer un Prix</NavItem>
      </VStack>

      <Spacer />

      <Box mt={10}> {/* Petit espace avant le bouton rouge */}
        <Button colorScheme="red" onClick={onLogout} width="full">
          Se déconnecter
        </Button>
      </Box>
    </Box>
  );
}