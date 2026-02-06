// Fichier : src/pages/NotificationsPage.jsx
// Page de gestion et d'historique des notifications automatiques

import React, { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Card, CardBody, CardHeader, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td,
  Button, Icon, VStack, HStack, Badge, useToast, Flex, Select, Input,
  Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import { FiMail, FiBell, FiCheck, FiX, FiSend } from 'react-icons/fi';
import axios from 'axios';

export default function NotificationsPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const toast = useToast();

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const fetchData = async () => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      // Fetch stats et notifications en parallèle
      const [statsRes, notificationsRes] = await Promise.all([
        axios.get('https://saas-immo.onrender.com/api/notifications/stats', config),
        axios.get('https://saas-immo.onrender.com/api/notifications', {
          ...config,
          params: {
            limit: ITEMS_PER_PAGE,
            offset: page * ITEMS_PER_PAGE,
            ...(filters.type && { type: filters.type }),
            ...(filters.status && { status: filters.status })
          }
        })
      ]);

      setStats(statsRes.data);
      setNotifications(notificationsRes.data.notifications);
      setTotal(notificationsRes.data.total);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(0); // Reset to first page
  };

  const getStatusBadge = (status) => {
    const colors = {
      'SENT': 'green',
      'FAILED': 'red',
      'PENDING': 'yellow'
    };
    return <Badge colorScheme={colors[status] || 'gray'}>{status}</Badge>;
  };

  const getChannelIcon = (channel) => {
    const icons = {
      'EMAIL': FiMail,
      'SMS': FiSend,
      'PUSH': FiBell
    };
    return icons[channel] || FiMail;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4}>Chargement des notifications...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="start" spacing={1} mb={6}>
        <Heading size="lg" color="white">Notifications Automatiques</Heading>
        <Text color="gray.400">Historique des alertes envoyées à vos acheteurs</Text>
      </VStack>

      {/* Statistiques globales */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiBell} color="blue.400" />
                  <Text color="gray.400">Total envoyées</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl" color="white">{stats?.total || 0}</StatNumber>
              <StatHelpText color="gray.500">Toutes notifications</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiCheck} color="green.400" />
                  <Text color="gray.400">Réussies</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl" color="white">
                {stats?.byStatus?.find(s => s.status === 'SENT')?._count?.id || 0}
              </StatNumber>
              <StatHelpText color="gray.500">Emails délivrés</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiX} color="red.400" />
                  <Text color="gray.400">Échouées</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl" color="white">
                {stats?.byStatus?.find(s => s.status === 'FAILED')?._count?.id || 0}
              </StatNumber>
              <StatHelpText color="gray.500">Erreurs d'envoi</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiMail} color="purple.400" />
                  <Text color="gray.400">7 derniers jours</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl" color="white">{stats?.recent || 0}</StatNumber>
              <StatHelpText color="gray.500">Activité récente</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filtres et Historique */}
      <Card bg="gray.800" borderColor="gray.700">
        <CardHeader>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Heading size="md" color="white">Historique des notifications</Heading>

            <HStack spacing={3}>
              <Select
                placeholder="Tous les types"
                size="sm"
                w="200px"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="NEW_PROPERTY_MATCH">Match nouveau bien</option>
                <option value="APPOINTMENT_REMINDER">Rappel RDV</option>
                <option value="NEW_LEAD">Nouveau lead</option>
              </Select>

              <Select
                placeholder="Tous les statuts"
                size="sm"
                w="150px"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="SENT">Envoyées</option>
                <option value="FAILED">Échouées</option>
                <option value="PENDING">En attente</option>
              </Select>
            </HStack>
          </Flex>
        </CardHeader>

        <CardBody overflowX="auto">
          {notifications.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">Aucune notification trouvée</Text>
              <Text fontSize="sm" color="gray.400" mt={2}>
                Les notifications automatiques seront envoyées lorsque vous ajouterez des biens correspondant aux critères de vos acheteurs.
              </Text>
            </Box>
          ) : (
            <>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Contact</Th>
                    <Th>Type</Th>
                    <Th>Canal</Th>
                    <Th>Sujet</Th>
                    <Th>Statut</Th>
                    <Th>Détails</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {notifications.map((notif) => {
                    const metadata = notif.metadata ? JSON.parse(notif.metadata) : {};

                    return (
                      <Tr key={notif.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {new Date(notif.sentAt).toLocaleDateString('fr-FR')}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(notif.sentAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {notif.contact?.firstName} {notif.contact?.lastName}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {notif.recipient}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="blue" fontSize="xs">
                            {notif.type === 'NEW_PROPERTY_MATCH' ? 'Match bien' : notif.type}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack>
                            <Icon as={getChannelIcon(notif.channel)} color="gray.600" />
                            <Text fontSize="sm">{notif.channel}</Text>
                          </HStack>
                        </Td>
                        <Td maxW="300px">
                          <Text fontSize="sm" noOfLines={2}>
                            {notif.subject}
                          </Text>
                        </Td>
                        <Td>
                          {getStatusBadge(notif.status)}
                        </Td>
                        <Td>
                          {metadata.matchScore && (
                            <Badge colorScheme="green">
                              {metadata.matchScore}% match
                            </Badge>
                          )}
                          {metadata.manual && (
                            <Badge colorScheme="purple" ml={1}>Manuel</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>

              {/* Pagination */}
              <Flex justify="space-between" align="center" mt={6}>
                <Text fontSize="sm" color="gray.600">
                  Affichage {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, total)} sur {total}
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    isDisabled={page === 0}
                  >
                    Précédent
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    isDisabled={(page + 1) * ITEMS_PER_PAGE >= total}
                  >
                    Suivant
                  </Button>
                </HStack>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>

      {/* Statistiques détaillées */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mt={8}>
        {/* Par type */}
        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <Heading size="sm" color="white">Par type</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              {stats?.byType?.map((item) => (
                <Flex key={item.type} justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.300">{item.type}</Text>
                  <Badge colorScheme="blue">{item.count}</Badge>
                </Flex>
              )) || <Text fontSize="sm" color="gray.500">Aucune donnée</Text>}
            </VStack>
          </CardBody>
        </Card>

        {/* Par canal */}
        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <Heading size="sm" color="white">Par canal</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              {stats?.byChannel?.map((item) => (
                <Flex key={item.channel} justify="space-between" align="center">
                  <HStack>
                    <Icon as={getChannelIcon(item.channel)} color="gray.400" />
                    <Text fontSize="sm" color="gray.300">{item.channel}</Text>
                  </HStack>
                  <Badge colorScheme="purple">{item.count}</Badge>
                </Flex>
              )) || <Text fontSize="sm" color="gray.500">Aucune donnée</Text>}
            </VStack>
          </CardBody>
        </Card>

        {/* Par statut */}
        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <Heading size="sm" color="white">Par statut</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              {stats?.byStatus?.map((item) => (
                <Flex key={item.status} justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.300">{item.status}</Text>
                  <Badge colorScheme={item.status === 'SENT' ? 'green' : item.status === 'FAILED' ? 'red' : 'yellow'}>
                    {item.count}
                  </Badge>
                </Flex>
              )) || <Text fontSize="sm" color="gray.500">Aucune donnée</Text>}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
