// Fichier : src/StatCard.jsx (Version Design Moderne)

import React from 'react';
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';

const topGradients = {
  blue:   'linear(to-r, brand.400, brand.600)',
  green:  'linear(to-r, green.400, teal.400)',
  purple: 'linear(to-r, purple.400, pink.400)',
};

const glowMap = {
  blue:   'rgba(99,102,241,0.2)',
  green:  'rgba(16,185,129,0.2)',
  purple: 'rgba(139,92,246,0.2)',
};

const iconColors = {
  blue:   { bg: 'rgba(99,102,241,0.15)',   color: 'brand.300' },
  green:  { bg: 'rgba(16,185,129,0.15)',   color: 'green.300' },
  purple: { bg: 'rgba(139,92,246,0.15)',   color: 'purple.300' },
};

export default function StatCard({ title, value, icon, colorScheme = "blue" }) {
  const glow     = glowMap[colorScheme]     || glowMap.blue;
  const gradient = topGradients[colorScheme] || topGradients.blue;
  const iconStyle = iconColors[colorScheme] || iconColors.blue;

  return (
    <Box position="relative" overflow="hidden" borderRadius="2xl">
      {/* Barre gradient en haut */}
      <Box
        position="absolute"
        top="0" left="0" right="0"
        h="2px"
        zIndex="1"
        bgGradient={gradient}
      />

      <Stat
        px={{ base: 4, md: 8 }}
        py={5}
        shadow="lg"
        borderWidth="1px"
        borderColor="rgba(99,102,241,0.12)"
        borderRadius="2xl"
        bg="linear-gradient(135deg, #1a1f2e 0%, #141924 100%)"
        transition="all 0.3s"
        _hover={{
          transform: 'translateY(-3px)',
          boxShadow: `0 8px 30px ${glow}`,
        }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Box pl={{ base: 2, md: 4 }}>
            <StatLabel fontWeight="bold" color="gray.500" isTruncated fontSize="sm" mb={1}>
              {title}
            </StatLabel>
            <StatNumber fontSize="4xl" fontWeight="extrabold" color="white">
              {value}
            </StatNumber>
          </Box>

          {/* Bulle icône */}
          <Box
            my="auto"
            color={iconStyle.color}
            bg={iconStyle.bg}
            p={3}
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={`0 4px 15px ${glow}`}
          >
            {icon}
          </Box>
        </Flex>
      </Stat>
    </Box>
  );
}
