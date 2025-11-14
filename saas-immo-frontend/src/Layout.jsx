// Fichier : src/Layout.jsx (Corrigé)

import React from 'react';
// LA CORRECTION EST ICI : J'ajoute 'Flex'
import { Box, Flex } from '@chakra-ui/react'; 
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ onLogout }) {
  return (
    <Flex> {/* Maintenant, React sait ce qu'est 'Flex' */}
      
      {/* 1. La Sidebar */}
      <Sidebar onLogout={onLogout} />

      {/* 2. Le Contenu de la Page */}
      <Box 
        ml="250px" // On décale le contenu (largeur de la sidebar)
        p={8}
        width="calc(100% - 250px)"
        minH="100vh"
        bg="gray.100" // Fond gris clair pour la zone de travail
      >
        <Outlet /> {/* Les pages (Biens, Contacts...) s'afficheront ici */}
      </Box>
    </Flex>
  );
}