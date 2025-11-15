// Fichier : src/Sidebar.jsx (Version Gris Foncé)

import React from 'react';
import { Box, VStack, Button, Heading, Spacer, Text } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';

// Style pour un lien actif (on le met un peu plus clair)
const activeStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)', // Léger blanc
  boxShadow: 'inset 3px 0 0 0 white', // Ligne blanche à gauche
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
        _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }} // Effet de survol subtil
        {...rest}
      >
        {children}
      </Button>
    </RouterNavLink>
  );

  return (
    <Box
      w="250px"
      bg="gray.800" // <-- LA MODIFICATION EST ICI (Gris foncé)
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