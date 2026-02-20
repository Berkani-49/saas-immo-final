import React from 'react';
import { HStack, Button, Text, IconButton } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <HStack justify="center" spacing={2} mt={6}>
      <IconButton
        icon={<FiChevronLeft />}
        size="sm"
        variant="ghost"
        color="gray.400"
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage <= 1}
        aria-label="Page précédente"
      />

      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        let page;
        if (totalPages <= 5) {
          page = i + 1;
        } else if (currentPage <= 3) {
          page = i + 1;
        } else if (currentPage >= totalPages - 2) {
          page = totalPages - 4 + i;
        } else {
          page = currentPage - 2 + i;
        }

        return (
          <Button
            key={page}
            size="sm"
            variant={page === currentPage ? 'solid' : 'ghost'}
            colorScheme={page === currentPage ? 'blue' : 'gray'}
            color={page === currentPage ? 'white' : 'gray.400'}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}

      <IconButton
        icon={<FiChevronRight />}
        size="sm"
        variant="ghost"
        color="gray.400"
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage >= totalPages}
        aria-label="Page suivante"
      />

      <Text fontSize="sm" color="gray.500" ml={2}>
        Page {currentPage} / {totalPages}
      </Text>
    </HStack>
  );
}
