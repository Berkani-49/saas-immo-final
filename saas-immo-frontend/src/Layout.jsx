// Fichier : src/Layout.jsx (Version Responsive Mobile)

import React from 'react';
import { 
  Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent 
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  // Gestion de l'ouverture/fermeture du menu mobile
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="gray.100">
      
      {/* 1. VERSION ORDI : Sidebar fixe à gauche */}
      <Box
        display={{ base: 'none', md: 'block' }} // Caché sur mobile
        w="250px"
        position="fixed"
        h="100vh"
      >
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* 2. VERSION MOBILE : Barre en haut avec Burger */}
      <Flex
        display={{ base: 'flex', md: 'none' }} // Caché sur ordi
        bg="white"
        p={4}
        alignItems="center"
        borderBottomWidth="1px"
        position="sticky"
        top="0"
        zIndex="sticky"
      >
        <IconButton
          icon={<HamburgerIcon w={6} h={6} />}
          onClick={onOpen}
          variant="ghost"
          aria-label="Ouvrir le menu"
        />
        <Box ml={4} fontWeight="bold" fontSize="lg">Mon Agence</Box>
      </Flex>

      {/* 3. LE TIROIR (DRAWER) MOBILE */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.800" maxWidth="250px">
          {/* On réutilise la même Sidebar, mais dans le tiroir */}
          <Sidebar onLogout={onLogout} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* 4. LE CONTENU DES PAGES */}
      <Box 
        ml={{ base: 0, md: "250px" }} // Marge à gauche seulement sur ordi
        p={4}
      >
        <Outlet />
      </Box>
    </Box>
  );
}