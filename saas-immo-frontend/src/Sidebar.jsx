// Fichier : src/Sidebar.jsx

import React from 'react';
import { Box, VStack, Button, Heading, Spacer, Text } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';

// Style pour un lien actif
const activeStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  boxShadow: 'inset 3px 0 0 0 white',
};

export default function Sidebar({ onLogout }) {
  
  // Fonction pour créer un lien
  const NavItem = ({ to, children, ...rest }) => (
    <RouterNavLink to={to} style={({ isActive }) => (isActive ? activeStyle : undefined)}>
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
      w="250px"
      bg="blue.800" // Un bleu foncé pour le menu
      color="white"
      h="100vh"
      position="fixed" // Le menu reste fixe quand on scrolle
      p={4}
      display="flex"
      flexDirection="column"
    >
      <Heading size="md" mb={8}>Mon Agence</Heading>

      <VStack align="stretch" spacing={2}>
        <NavItem to="/" end>Accueil</NavItem>
        <NavItem to="/biens">Mes Biens</NavItem>
        <NavItem to="/contacts">Mes Contacts</NavItem>
        <NavItem to="/taches">Mes Tâches</NavItem>
        <NavItem to="/estimate">Estimer un Prix</NavItem>
      </VStack>

      <Spacer />

      <Button colorScheme="red" onClick={onLogout}>
        Se déconnecter
      </Button>
    </Box>
  );
}