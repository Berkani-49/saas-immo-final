// Fichier : src/Layout.jsx (Version avec Drawer mobile + SearchBar)

import React, { useEffect } from 'react';
import { Box, Flex, Text, Icon, SimpleGrid, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent } from '@chakra-ui/react';
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { FiHome, FiList, FiUsers, FiCheckSquare, FiCalendar, FiMenu, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar.jsx';

// Navigation mobile - Fonctions essentielles
const MobileNavItems = [
  { name: 'Accueil', icon: FiHome, path: '/' },
  { name: 'Biens', icon: FiList, path: '/biens' },
  { name: 'Contacts', icon: FiUsers, path: '/contacts' },
  { name: 'Tâches', icon: FiCheckSquare, path: '/taches' },
  { name: 'RDV', icon: FiCalendar, path: '/rendez-vous' },
];

export default function Layout({ onLogout }) {
  const location = useLocation();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const token = localStorage.getItem('token');

  // Ferme le drawer à chaque changement de route (évite l'overlay Chakra coincé sur mobile)
  useEffect(() => {
    onDrawerClose();
  }, [location.pathname]);

  return (
    <Flex minH="100vh" w="100vw" bg="gray.900" overflowX="hidden" direction="column">

      {/* --- SIDEBAR ORDI --- */}
      <Box
        display={{ base: 'none', md: 'block' }}
        w="250px" minW="250px" h="100vh"
        position="fixed" left="0" top="0" zIndex="100"
        bg="transparent"
        borderRight="none"
      >
        <Sidebar onLogout={onLogout} token={token} />
      </Box>

      {/* --- HEADER MOBILE --- */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        h="60px" alignItems="center" justifyContent="space-between"
        bg="linear-gradient(135deg, #1a1f2e 0%, #141924 100%)"
        borderBottom="1px solid rgba(99,102,241,0.15)"
        px={4} position="sticky" top="0" zIndex="90"
      >
        <IconButton
          icon={<Icon as={FiMenu} />}
          size="sm"
          variant="ghost"
          color="gray.300"
          onClick={onDrawerOpen}
          aria-label="Menu"
        />
        <Text fontSize="lg" fontWeight="bold" color="white">IMMO<Text as="span" color="brand.400">FLOW</Text></Text>
        <IconButton
          icon={<Icon as={FiLogOut} />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={onLogout}
          aria-label="Déconnexion"
        />
      </Flex>

      {/* --- DRAWER MOBILE (menu complet) --- */}
      <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose} size="xs" motionPreset="none">
        <DrawerOverlay />
        <DrawerContent bg="linear-gradient(180deg, #1a1f2e 0%, #141924 100%)" maxW="280px">
          <Sidebar onLogout={onLogout} onClose={onDrawerClose} token={token} />
        </DrawerContent>
      </Drawer>

      {/* --- CONTENU --- */}
      <Flex
        direction="column" flex="1"
        ml={{ base: 0, md: "250px" }}
        pb={{ base: "80px", md: 0 }}
        minH="100vh" overflowX="hidden"
      >
        <Box p={{ base: 4, md: 8 }} w="100%" maxW="1600px" mx="auto">
          <Outlet />
        </Box>
      </Flex>

      {/* --- BARRE DE NAVIGATION MOBILE --- */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed" bottom="0" left="0" w="100%"
        bg="rgba(20,25,36,0.97)"
        backdropFilter="blur(20px)"
        borderTop="1px solid rgba(99,102,241,0.12)"
        zIndex="999" pb="env(safe-area-inset-bottom)"
        boxShadow="0px -4px 20px rgba(0,0,0,0.4)"
      >
        <SimpleGrid columns={5} h="70px">
          {MobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink key={item.name} to={item.path} style={{ textDecoration: 'none' }}>
                <Flex
                  direction="column" align="center" justify="center" h="100%"
                  color={isActive ? 'brand.400' : 'gray.400'}
                  transition="all 0.2s"
                  _active={{ bg: 'gray.700' }}
                >
                  <Icon as={item.icon} w={6} h={6} mb={1} />
                  <Text fontSize="10px" fontWeight={isActive ? 'semibold' : 'normal'}>
                    {item.name}
                  </Text>
                </Flex>
              </RouterNavLink>
            );
          })}
        </SimpleGrid>
      </Box>

    </Flex>
  );
}
