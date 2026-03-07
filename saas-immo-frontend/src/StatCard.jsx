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
  blue:   { bar: 'linear(to-r, brand.400, brand.600)', icon: { bg: 'brand.50', color: 'brand.600' } },
  green:  { bar: 'linear(to-r, #10B981, #059669)', icon: { bg: '#ECFDF5', color: '#059669' } },
  purple: { bar: 'linear(to-r, #A78BFA, #7C3AED)', icon: { bg: '#F5F3FF', color: '#7C3AED' } },
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
        px={{ base: 3, md: 6 }}
        py={{ base: 4, md: 5 }}
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
        <Flex justifyContent="space-between" alignItems="center" gap={2}>
          <Box minW={0}>
            <StatLabel
              fontWeight="medium"
              color="gray.500"
              fontSize={{ base: 'xs', md: 'sm' }}
              mb={1}
              noOfLines={2}
              whiteSpace="normal"
            >
              {title}
            </StatLabel>
            <StatNumber fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="gray.800">
              {value}
            </StatNumber>
          </Box>

          <Box
            flexShrink={0}
            color={accent.icon.color}
            bg={accent.icon.bg}
            p={{ base: 2, md: 3 }}
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
