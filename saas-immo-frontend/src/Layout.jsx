// Fichier : src/Layout.jsx (Version Anti-Débordement)

import React from 'react';
import { Box, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Text, Flex } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    // 1. Conteneur Global : On force la largeur max à la taille de l'écran et on coupe tout ce qui dépasse
    <Box minH="100vh" bg="gray.50" w="100%" maxW="100vw" overflowX="hidden">
      
      {/* --- SIDEBAR ORDI (Fixe à gauche) --- */}
      <Box 
        display={{ base: 'none', md: 'block' }} 
        w="250px" 
        position="fixed" 
        top="0"
        left="0"
        h="100vh" 
        zIndex="100"
      >
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* --- SIDEBAR MOBILE (Tiroir) --- */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900" maxWidth="250px">
          <Sidebar onLogout={onLogout} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* --- ZONE DE CONTENU (À droite) --- */}
      <Box 
        ml={{ base: 0, md: "250px" }} 
        w="auto"                      
        minH="100vh"
        position="relative" // Important pour que le overflow hidden du parent fonctionne bien
      >
        
        {/* Header Mobile */}
        <Flex
          display={{ base: 'flex', md: 'none' }}
          h="60px"
          alignItems="center"
          bg="white"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
          px={4}
          position="sticky"
          top="0"
          zIndex="90"
        >
          <IconButton variant="ghost" onClick={onOpen} aria-label="Menu" icon={<HamburgerIcon boxSize={6} />} />
          <Text fontSize="lg" ml={3} fontWeight="bold" color="gray.800">IMMO PRO</Text>
        </Flex>

        {/* LE VRAI CONTENU DE LA PAGE */}
        <Box p={{ base: 4, md: 8 }} maxW="100%"> {/* On limite aussi ici */}
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}