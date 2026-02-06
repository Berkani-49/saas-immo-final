// Fichier : src/StatCard.jsx (Version Design Aéré)

import React from 'react';
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';

export default function StatCard({ title, value, icon, colorScheme = "blue" }) {
  // Couleurs pour le mode sombre
  const iconBg = `${colorScheme}.900`;
  const iconColor = `${colorScheme}.300`;

  return (
    <Stat
      px={{ base: 4, md: 8 }}
      py={5}
      shadow="lg"
      borderWidth="1px"
      borderColor="gray.700"
      borderRadius="2xl"
      bg="gray.800"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight="bold" color="gray.400" isTruncated fontSize="sm" mb={1}>
            {title}
          </StatLabel>
          <StatNumber fontSize="4xl" fontWeight="extrabold" color="white">
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