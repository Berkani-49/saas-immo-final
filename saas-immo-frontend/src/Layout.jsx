// Fichier : src/Layout.jsx (Version Mobile avec Équipe)

import React from 'react';
import { Box, Flex, Text, Icon, SimpleGrid, IconButton } from '@chakra-ui/react';
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
// 1. On ajoute les icônes nécessaires
import { FiHome, FiList, FiUsers, FiCheckSquare, FiCalendar, FiMenu, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar.jsx';

// Navigation mobile - Fonctions essentielles + menu
const MobileNavItems = [
  { name: 'Accueil', icon: FiHome, path: '/' },
  { name: 'Biens', icon: FiList, path: '/biens' },
  { name: 'Contacts', icon: FiUsers, path: '/contacts' },
  { name: 'Tâches', icon: FiCheckSquare, path: '/taches' },
  { name: 'RDV', icon: FiCalendar, path: '/rendez-vous' },
];

export default function Layout({ onLogout }) {
  const location = useLocation();

  return (
    <Flex minH="100vh" w="100vw" bg="gray.50" overflowX="hidden" direction="column">
      
      {/* --- SIDEBAR ORDI --- */}
      <Box 
        display={{ base: 'none', md: 'block' }} 
        w="250px" minW="250px" h="100vh" 
        position="fixed" left="0" top="0" zIndex="100"
        bg="brand.900"
      >
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* --- HEADER MOBILE --- */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        h="60px" alignItems="center" justifyContent="space-between"
        bg="white" borderBottomWidth="1px" borderBottomColor="gray.200"
        px={4} position="sticky" top="0" zIndex="90"
      >
        <Box w="40px" /> {/* Spacer pour centrer le titre */}
        <Text fontSize="lg" fontWeight="bold" color="brand.600">IMMO PRO</Text>
        <IconButton
          icon={<Icon as={FiLogOut} />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={onLogout}
          aria-label="Déconnexion"
        />
      </Flex>

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
        bg="white" borderTopWidth="1px" borderTopColor="gray.200"
        zIndex="999" pb="env(safe-area-inset-bottom)"
        boxShadow="0px -2px 10px rgba(0,0,0,0.05)"
      >
        <SimpleGrid columns={5} h="70px">
          {MobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink key={item.name} to={item.path} style={{ textDecoration: 'none' }}>
                <Flex
                  direction="column" align="center" justify="center" h="100%"
                  color={isActive ? 'brand.500' : 'gray.500'}
                  transition="all 0.2s"
                  _active={{ bg: 'gray.100' }}
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