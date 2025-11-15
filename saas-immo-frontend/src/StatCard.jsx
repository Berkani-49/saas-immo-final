// Fichier : src/StatCard.jsx

import React from 'react';
import {
  Stat,
  StatLabel,
  StatNumber,
  Box,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';

export default function StatCard({ title, value, icon }) {
  return (
    <Stat
      p={4}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={useColorModeValue('white', 'gray.700')}
    >
      <Flex justifyContent="space-between">
        <Box>
          <StatLabel fontWeight="medium" isTruncated color="gray.500">
            {title}
          </StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold">
            {value}
          </StatNumber>
        </Box>
        <Box
          my="auto"
          color={useColorModeValue('gray.600', 'gray.200')}
          alignContent="center"
        >
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
}