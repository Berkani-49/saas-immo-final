// Fichier: src/App.jsx

import React from 'react';
import { Box, Heading, Center } from '@chakra-ui/react';

export default function App() {
  return (
    <Center h="100vh">
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading as="h1" size="xl" textAlign="center">
          HELLO WORLD FINAL
        </Heading>
        <p>Ce texte doit s'afficher.</p>
      </Box>
    </Center>
  );
}