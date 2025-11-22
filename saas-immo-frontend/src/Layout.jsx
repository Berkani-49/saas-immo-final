// Fichier : src/Layout.jsx (Version Flexbox - Zéro débordement)

import React from 'react';
import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Text } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    // 1. Conteneur principal qui empêche tout débordement horizontal
    <Flex minH="100vh" w="100vw" bg="gray.50" overflowX="hidden">
      
      {/* --- SIDEBAR ORDI (Fixe) --- */}
      <Box 
        display={{ base: 'none', md: 'block' }} 
        w="250px" 
        minW="250px" // Empêche la sidebar de s'écraser
        h="100vh"
        position="fixed"
        left="0"
        top="0"
        zIndex="100"
      >
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* --- SIDEBAR MOBILE (Tiroir) --- */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900" maxWidth="250px">
          <Sidebar onLogout={onLogout} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* --- CONTENU (Partie Droite) --- */}
      <Flex 
        direction="column"
        flex="1" // Prend tout l'espace restant automatiquement
        ml={{ base: 0, md: "250px" }} // Laisse la place à la sidebar
        minH="100vh"
        overflowX="hidden" // Sécurité supplémentaire
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

        {/* La Page */}
        <Box p={{ base: 4, md: 8 }} w="100%">
          <Outlet />
        </Box>

      </Flex>
    </Flex>
  );
}