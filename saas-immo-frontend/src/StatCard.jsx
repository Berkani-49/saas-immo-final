// Fichier : src/StatCard.jsx (Version Light Mode - Style Agence)

import React from 'react';
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';

const accentColors = {
  blue:   { bar: 'linear(to-r, blue.400, brand.500)', icon: { bg: 'blue.50', color: 'brand.500' } },
  green:  { bar: 'linear(to-r, green.400, teal.500)', icon: { bg: 'green.50', color: 'green.600' } },
  purple: { bar: 'linear(to-r, purple.400, pink.400)', icon: { bg: 'purple.50', color: 'purple.600' } },
};

export default function StatCard({ title, value, icon, colorScheme = "blue" }) {
  const accent = accentColors[colorScheme] || accentColors.blue;

  return (
    <Box position="relative" overflow="hidden" borderRadius="xl">
      {/* Barre couleur en haut */}
      <Box
        position="absolute"
        top="0" left="0" right="0"
        h="3px"
        zIndex="1"
        bgGradient={accent.bar}
      />

      <Stat
        px={{ base: 4, md: 6 }}
        py={5}
        shadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-2px)',
          shadow: 'md',
        }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Box pl={{ base: 2, md: 2 }}>
            <StatLabel fontWeight="medium" color="gray.500" isTruncated fontSize="sm" mb={1}>
              {title}
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="gray.800">
              {value}
            </StatNumber>
          </Box>

          <Box
            my="auto"
            color={accent.icon.color}
            bg={accent.icon.bg}
            p={3}
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {icon}
          </Box>
        </Flex>
      </Stat>
    </Box>
  );
}
