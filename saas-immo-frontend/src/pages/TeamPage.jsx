// Fichier : src/pages/TeamPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Table, Thead, Tbody, Tr, Th, Td,
  Avatar, Text, Button, Flex, Badge, IconButton, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function TeamPage({ token }) {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();

  useEffect(() => {
    // Décoder le token pour obtenir le rôle de l'utilisateur actuel
    try {
      const decoded = jwtDecode(token);
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      // Récupérer les infos complètes de l'utilisateur actuel
      axios.get(`https://saas-immo.onrender.com/api/agents`, config)
        .then(response => {
          const currentUser = response.data.find(agent => agent.id === decoded.id);
          if (currentUser) {
            setCurrentUserRole(currentUser.role);
          }
        });
    } catch (error) {
      console.error("Erreur décodage token:", error);
    }

    const fetchAgents = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo.onrender.com/api/agents', config);
        setAgents(response.data);
      } catch (error) {
        console.error("Erreur", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, [token]);

  const handleDeleteClick = (agent) => {
    setAgentToDelete(agent);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://saas-immo.onrender.com/api/agents/${agentToDelete.id}`, config);

      // Retirer l'agent de la liste
      setAgents(agents.filter(a => a.id !== agentToDelete.id));

      toast({
        title: 'Membre supprimé',
        description: `${agentToDelete.firstName} ${agentToDelete.lastName} a été retiré de l'équipe`,
        status: 'success',
        duration: 5000,
      });

      onClose();
      setAgentToDelete(null);
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer ce membre',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const isOwner = currentUserRole === 'OWNER';

  if (isLoading) return <Flex justify="center" mt={10}><Spinner size="xl" color="brand.500" /></Flex>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="white">L'Équipe</Heading>

        {/* Le bouton vers la page secrète - visible uniquement pour le patron */}
        {isOwner && (
          <Link to="/nouveau-membre-agence">
            <Button leftIcon={<AddIcon />} colorScheme="brand">
              Nouveau Membre
            </Button>
          </Link>
        )}
      </Flex>

      <Box bg="gray.800" shadow="sm" borderRadius="lg" overflow="hidden" borderWidth="1px" borderColor="gray.700">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color="gray.400" borderColor="gray.700">Agent</Th>
              <Th color="gray.400" borderColor="gray.700">Email</Th>
              <Th color="gray.400" borderColor="gray.700">Rôle</Th>
              <Th color="gray.400" borderColor="gray.700">Membre depuis</Th>
              <Th color="gray.400" borderColor="gray.700">Statut</Th>
              {isOwner && <Th color="gray.400" borderColor="gray.700" textAlign="center">Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {agents.map((agent) => (
              <Tr key={agent.id}>
                <Td borderColor="gray.700">
                  <Flex align="center">
                    <Avatar
                      size="sm"
                      name={`${agent.firstName} ${agent.lastName}`}
                      mr={3}
                      bg={agent.role === 'OWNER' ? 'purple.500' : 'brand.500'}
                      color="white"
                    />
                    <Text fontWeight="bold" color="white">{agent.firstName} {agent.lastName}</Text>
                  </Flex>
                </Td>
                <Td color="gray.300" borderColor="gray.700">{agent.email}</Td>
                <Td borderColor="gray.700">
                  <Badge colorScheme={agent.role === 'OWNER' ? 'purple' : 'blue'}>
                    {agent.role === 'OWNER' ? 'Patron' : 'Employé'}
                  </Badge>
                </Td>
                <Td color="gray.300" borderColor="gray.700">{new Date(agent.createdAt).toLocaleDateString()}</Td>
                <Td borderColor="gray.700"><Badge colorScheme="green">Actif</Badge></Td>
                {isOwner && (
                  <Td borderColor="gray.700" textAlign="center">
                    {agent.role !== 'OWNER' && (
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        aria-label="Supprimer le membre"
                        onClick={() => handleDeleteClick(agent)}
                      />
                    )}
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer le membre
            </AlertDialogHeader>

            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer <strong>{agentToDelete?.firstName} {agentToDelete?.lastName}</strong> de l'équipe ?
              <br /><br />
              Cette action supprimera également toutes ses données (biens, contacts, tâches, etc.).
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}