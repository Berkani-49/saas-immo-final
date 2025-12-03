// Fichier : src/Layout.jsx (Version Finale Corrigée)

import React from 'react';
import { Box, Flex, Text, Icon, SimpleGrid, IconButton } from '@chakra-ui/react';
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
// UNE SEULE LIGNE D'IMPORT POUR TOUTES LES ICÔNES :
import { FiHome, FiList, FiUsers, FiCheckSquare, FiFileText, FiBriefcase, FiLogOut, FiCreditCard } from 'react-icons/fi';
import Sidebar from './Sidebar.jsx';

const MobileNavItems = [
  { name: 'Accueil', icon: FiHome, path: '/' },
  { name: 'Biens', icon: FiList, path: '/biens' },
  { name: 'Clients', icon: FiUsers, path: '/contacts' },
  { name: 'Tâches', icon: FiCheckSquare, path: '/taches' },
  { name: 'Factures', icon: FiFileText, path: '/factures' },
  { name: 'Équipe', icon: FiBriefcase, path: '/equipe' },
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
        {/* Titre cliquable pour déconnexion rapide (alternative) */}
        <Text 
            fontSize="lg" fontWeight="bold" color="brand.600" 
            onClick={() => { if(window.confirm("Se déconnecter ?")) onLogout(); }}
        >
            IMMO PRO
        </Text>

        {/* Bouton Déconnexion Rouge */}
        <IconButton 
          icon={<Icon as={FiLogOut} w={5} h={5} />} 
          onClick={onLogout} 
          variant="ghost" 
          colorScheme="red" 
          aria-label="Déconnexion"
          size="sm"
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

      {/* --- BARRE DE NAVIGATION MOBILE (Dock Flottant) --- */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed" bottom={4} left={4} right={4}
        bg="white" borderRadius="2xl" zIndex="999" 
        boxShadow="0px 10px 30px rgba(0,0,0,0.15)"
        borderWidth="1px" borderColor="gray.100"
        pb="env(safe-area-inset-bottom)"
      >
        <SimpleGrid columns={6} h="64px" alignItems="center">
          {MobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink key={item.name} to={item.path} style={{ textDecoration: 'none' }}>
                <Flex 
                  direction="column" align="center" justify="center" h="100%" 
                  color={isActive ? 'brand.500' : 'gray.400'}
                  transform={isActive ? 'scale(1.1)' : 'scale(1)'}
                  transition="all 0.2s"
                  position="relative"
                >
                  {isActive && <Box position="absolute" top="-8px" w="4px" h="4px" bg="brand.500" borderRadius="full" />}
                  <Icon as={item.icon} w={5} h={5} mb={0.5} />
                  <Text fontSize="9px" fontWeight={isActive ? 'bold' : 'medium'}>{item.name}</Text>
                </Flex>
              </RouterNavLink>
            );
          })}
        </SimpleGrid>
      </Box>

    </Flex>
  );
}