// Fichier : src/StatCard.jsx (Version Design Alignée)

import React from 'react';
import { Box, Flex, Stat, StatLabel, StatNumber, useColorModeValue } from '@chakra-ui/react';

export default function StatCard({ title, value, icon, colorScheme = "blue" }) {
  const iconBg = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.200`);

  return (
    <Stat
      px={6} py={6} // Un peu plus d'espace interne
      shadow="lg"
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      bg="white"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-3px)', shadow: 'xl' }}
    >
      <Flex justifyContent="space-between" alignItems="center" h="100%">
        <Box>
          <StatLabel fontWeight="bold" color="gray.500" fontSize="sm" mb={1} textTransform="uppercase" letterSpacing="wide">
            {title}
          </StatLabel>
          <StatNumber fontSize="4xl" fontWeight="extrabold" color="gray.800" lineHeight="1">
            {value}
          </StatNumber>
        </Box>
        
        {/* Icône bien centrée */}
        <Flex
          align="center" justify="center"
          w={14} h={14} // Taille fixe pour l'alignement parfait
          bg={iconBg} color={iconColor}
          borderRadius="xl" // Carré arrondi (plus moderne que rond)
          fontSize="2xl"
        >
          {icon}
        </Flex>
      </Flex>
    </Stat>
  );
}