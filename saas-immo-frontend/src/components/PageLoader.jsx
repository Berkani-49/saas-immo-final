// Fichier : src/components/PageLoader.jsx
// Composant de chargement pour le lazy loading des pages

import { Center, Spinner, VStack, Text } from '@chakra-ui/react';

export default function PageLoader() {
  return (
    <Center h="60vh">
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
        <Text color="gray.500" fontSize="sm">
          Chargement...
        </Text>
      </VStack>
    </Center>
  );
}
