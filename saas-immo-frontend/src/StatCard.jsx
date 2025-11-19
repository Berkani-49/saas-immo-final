// Fichier : src/StatCard.jsx (Version Design Aéré)

import React from 'react';
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
} from '@chakra-ui/react';

export default function StatCard({ title, value, icon, colorScheme = "blue" }) {
  // Couleurs dynamiques pour la bulle de l'icône
  const iconBg = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.200`);

  return (
    <Stat
      px={{ base: 4, md: 8 }} // Plus de marge intérieure
      py={5}
      shadow="lg" // Ombre plus prononcée
      borderWidth="1px"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      borderRadius="2xl" // Coins bien arrondis (tendance actuelle)
      bg={useColorModeValue('white', 'gray.800')}
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }} // Petit effet au survol
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight="bold" color="gray.500" isTruncated fontSize="sm" mb={1}>
            {title}
          </StatLabel>
          <StatNumber fontSize="4xl" fontWeight="extrabold" color="gray.800">
            {value}
          </StatNumber>
        </Box>
        
        {/* La bulle d'icône */}
        <Box
          my="auto"
          color={iconColor}
          bg={iconBg}
          p={3}
          borderRadius="full" // Rond parfait
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
}