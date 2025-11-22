// Fichier : src/Layout.jsx

import React from 'react';
import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Text } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minH="100vh" bg="gray.50">
      
      {/* --- SIDEBAR (Desktop) --- */}
      <Box display={{ base: 'none', md: 'block' }} w="250px" position="fixed" h="100vh" zIndex="100">
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* --- SIDEBAR (Mobile Drawer) --- */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900" maxWidth="250px">
          <Sidebar onLogout={onLogout} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* --- CONTENU PRINCIPAL --- */}
      <Box flex="1" ml={{ base: 0, md: "250px" }} transition="margin-left 0.3s">
        
        {/* Header Mobile (Burger) */}
        <Flex
          display={{ base: 'flex', md: 'none' }}
          h="20"
          alignItems="center"
          bg="white"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
          px={4}
          position="sticky"
          top="0"
          zIndex="90"
        >
          <IconButton variant="outline" onClick={onOpen} aria-label="Ouvrir menu" icon={<HamburgerIcon />} />
          <Text fontSize="lg" ml={4} fontWeight="bold">Mon Agence</Text>
        </Flex>

        {/* La Page */}
        <Box p={8}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
}