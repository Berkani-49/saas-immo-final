// Fichier : src/Layout.jsx (Version Finale : Bleu Nuit + Menu Mobile Bas)

import React from 'react';
import { Box, Flex, Text, Icon, SimpleGrid } from '@chakra-ui/react';
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { FiHome, FiList, FiUsers, FiCheckSquare, FiFileText } from 'react-icons/fi';
import Sidebar from './Sidebar.jsx';

const MobileNavItems = [
  { name: 'Accueil', icon: FiHome, path: '/' },
  { name: 'Biens', icon: FiList, path: '/biens' },
  { name: 'Clients', icon: FiUsers, path: '/contacts' },
  { name: 'Tâches', icon: FiCheckSquare, path: '/taches' },
  { name: 'Factures', icon: FiFileText, path: '/factures' },
];

export default function Layout({ onLogout }) {
  const location = useLocation();

  return (
    <Flex minH="100vh" w="100vw" bg="gray.50" overflowX="hidden" direction="column">
      
      {/* --- 1. SIDEBAR ORDI (Cachée sur mobile) --- */}
      <Box 
        display={{ base: 'none', md: 'block' }} 
        w="250px" minW="250px" h="100vh" 
        position="fixed" left="0" top="0" zIndex="100"
        bg="brand.900" // <--- LA COULEUR BLEU NUIT EST ICI
      >
        <Sidebar onLogout={onLogout} />
      </Box>

      {/* --- 2. HEADER MOBILE --- */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        h="60px" alignItems="center" justifyContent="center"
        bg="white" borderBottomWidth="1px" borderBottomColor="gray.200"
        px={4} position="sticky" top="0" zIndex="90"
      >
        <Text fontSize="lg" fontWeight="bold" color="brand.600">IMMO PRO</Text>
      </Flex>

      {/* --- 3. CONTENU --- */}
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

      {/* --- 4. BARRE DE NAVIGATION MOBILE (En bas) --- */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed" bottom="0" left="0" w="100%"
        bg="white" borderTopWidth="1px" borderTopColor="gray.200"
        zIndex="999" pb="env(safe-area-inset-bottom)"
        boxShadow="0px -2px 10px rgba(0,0,0,0.05)"
      >
        <SimpleGrid columns={5} h="60px">
          {MobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink key={item.name} to={item.path} style={{ textDecoration: 'none' }}>
                <Flex 
                  direction="column" align="center" justify="center" h="100%" 
                  color={isActive ? 'brand.500' : 'gray.400'} // Couleur Or si actif
                  _active={{ bg: 'gray.50' }}
                >
                  <Icon as={item.icon} w={5} h={5} mb={1} />
                  <Text fontSize="10px" fontWeight={isActive ? 'bold' : 'normal'}>
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