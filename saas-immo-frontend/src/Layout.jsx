// Fichier : src/Layout.jsx (Version Stable & Simple)

import React from 'react';
import { Box, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Text, Flex } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    // 1. Le Conteneur Global (Tout le fond est gris)
    <Box minH="100vh" bg="gray.50">
      
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
        ml={{ base: 0, md: "250px" }} // Sur ordi, on pousse le contenu de 250px
        w="auto"                      // On laisse la largeur se faire toute seule (C'est la clé !)
        minH="100vh"                  // Force le fond gris à aller tout en bas
        transition="all 0.3s"
      >
        
        {/* Header Mobile (Visible uniquement sur petit écran) */}
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
        <Box p={{ base: 4, md: 8 }}> {/* Marges intérieures confortables */}
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}