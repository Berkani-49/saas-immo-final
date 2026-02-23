import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Input, InputGroup, InputLeftElement, VStack, HStack, Text, Icon, Badge,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalBody, Kbd, Flex, Spinner
} from '@chakra-ui/react';
import { FiSearch, FiHome, FiUser, FiCheckSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function SearchBar({ token }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ properties: [], contacts: [], tasks: [] });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Raccourci Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, onClose]);

  // Focus input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ properties: [], contacts: [], tasks: [] });
    }
  }, [isOpen]);

  // Recherche avec debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ properties: [], contacts: [], tasks: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`${API_URL}/api/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: query }
        });
        setResults(res.data);
      } catch (err) {
        console.error('Erreur recherche:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  const handleSelect = (type, id) => {
    onClose();
    if (type === 'property') navigate(`/property/${id}`);
    else if (type === 'contact') navigate(`/contact/${id}`);
    else if (type === 'task') navigate('/taches');
  };

  const totalResults = results.properties.length + results.contacts.length + results.tasks.length;

  return (
    <>
      {/* Bouton d'ouverture dans la sidebar */}
      <Flex
        onClick={onOpen}
        cursor="pointer"
        bg="gray.50"
        borderRadius="lg"
        px={3}
        py={2}
        mx={4}
        mb={4}
        align="center"
        _hover={{ bg: 'gray.600' }}
        transition="all 0.2s"
      >
        <Icon as={FiSearch} color="gray.400" mr={2} />
        <Text color="gray.400" fontSize="sm" flex="1">Rechercher...</Text>
        <HStack spacing={1}>
          <Kbd fontSize="xs" bg="gray.600" color="gray.600">Ctrl</Kbd>
          <Kbd fontSize="xs" bg="gray.600" color="gray.600">K</Kbd>
        </HStack>
      </Flex>

      {/* Modal de recherche */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg="white" borderColor="gray.300" borderWidth="1px" mt="15vh">
          <ModalBody p={0}>
            <InputGroup>
              <InputLeftElement h="50px">
                {isSearching ? <Spinner size="sm" color="brand.400" /> : <Icon as={FiSearch} color="gray.400" />}
              </InputLeftElement>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un bien, contact, tâche..."
                h="50px"
                border="none"
                bg="transparent"
                color="gray.800"
                fontSize="md"
                _focus={{ boxShadow: 'none' }}
                _placeholder={{ color: 'gray.500' }}
              />
            </InputGroup>

            {totalResults > 0 && (
              <Box borderTopWidth="1px" borderColor="gray.200" maxH="400px" overflowY="auto">
                {results.properties.length > 0 && (
                  <Box p={3}>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={2} px={2}>BIENS</Text>
                    {results.properties.map(p => (
                      <HStack
                        key={p.id}
                        px={3} py={2}
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: 'gray.700' }}
                        onClick={() => handleSelect('property', p.id)}
                      >
                        <Icon as={FiHome} color="blue.400" />
                        <Text color="gray.800" fontSize="sm" flex="1">{p.address}, {p.city}</Text>
                        {p.price && <Badge colorScheme="green">{p.price.toLocaleString()} EUR</Badge>}
                      </HStack>
                    ))}
                  </Box>
                )}

                {results.contacts.length > 0 && (
                  <Box p={3} borderTopWidth="1px" borderColor="gray.200">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={2} px={2}>CONTACTS</Text>
                    {results.contacts.map(c => (
                      <HStack
                        key={c.id}
                        px={3} py={2}
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: 'gray.700' }}
                        onClick={() => handleSelect('contact', c.id)}
                      >
                        <Icon as={FiUser} color="purple.400" />
                        <Text color="gray.800" fontSize="sm" flex="1">{c.firstName} {c.lastName}</Text>
                        <Badge colorScheme={c.type === 'BUYER' ? 'blue' : 'orange'} fontSize="xs">{c.type}</Badge>
                      </HStack>
                    ))}
                  </Box>
                )}

                {results.tasks.length > 0 && (
                  <Box p={3} borderTopWidth="1px" borderColor="gray.200">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={2} px={2}>TACHES</Text>
                    {results.tasks.map(t => (
                      <HStack
                        key={t.id}
                        px={3} py={2}
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: 'gray.700' }}
                        onClick={() => handleSelect('task', t.id)}
                      >
                        <Icon as={FiCheckSquare} color="green.400" />
                        <Text color="gray.800" fontSize="sm" flex="1">{t.title}</Text>
                        <Badge colorScheme={t.status === 'COMPLETED' ? 'green' : 'orange'} fontSize="xs">{t.status}</Badge>
                      </HStack>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {query.trim().length >= 2 && !isSearching && totalResults === 0 && (
              <Box p={6} textAlign="center" borderTopWidth="1px" borderColor="gray.200">
                <Text color="gray.500" fontSize="sm">Aucun résultat pour "{query}"</Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
