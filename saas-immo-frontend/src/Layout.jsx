// Fichier : src/Layout.jsx (Version Béton Armé)

import React from 'react';
import { Box, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Text, Flex } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" w="100%">
      
      {/* --- 1. SIDEBAR ORDI (Fixe) --- */}
      <Box 
        display={{ base: 'none', md: 'block' }} 
        w="250px" 
        h="100vh"
        position="fixed"
        left="0"
        top="0"
        zIndex="999"
        bg="gray.900" // On force la couleur de fond du menu ici aussi
      >
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* --- 2. SIDEBAR MOBILE (Tiroir) --- */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900" maxWidth="250px">
          <Sidebar onLogout={onLogout} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* --- 3. CONTENU PRINCIPAL --- */}
      <Box 
        ml={{ base: 0, md: "250px" }} // Marge à gauche pour laisser la place au menu
        minH="100vh"                  // Prend toute la hauteur
        bg="gray.50"                  // Fond gris clair
        transition="all 0.3s"
        w="auto"                      // Largeur auto (remplit le reste)
        position="relative"
      >
        
        {/* Header Mobile (visible seulement sur petit écran) */}
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
          zIndex="900"
        >
          <IconButton variant="ghost" onClick={onOpen} aria-label="Menu" icon={<HamburgerIcon boxSize={6} />} />
          <Text fontSize="lg" ml={3} fontWeight="bold" color="gray.800">IMMO PRO</Text>
        </Flex>

        {/* La Page elle-même */}
        <Box p={{ base: 4, md: 8 }}>
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}