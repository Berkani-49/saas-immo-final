import React from 'react';
import { VStack, Text, Icon, Button } from '@chakra-ui/react';
import { FiInbox, FiPlus } from 'react-icons/fi';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <VStack spacing={4} py={12} px={6} textAlign="center">
      <Icon as={icon || FiInbox} boxSize={12} color="gray.600" />
      <Text fontSize="lg" fontWeight="semibold" color="gray.400">
        {title || 'Aucun élément'}
      </Text>
      {description && (
        <Text fontSize="sm" color="gray.500" maxW="400px">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          size="sm"
          onClick={onAction}
          mt={2}
        >
          {actionLabel}
        </Button>
      )}
    </VStack>
  );
}
