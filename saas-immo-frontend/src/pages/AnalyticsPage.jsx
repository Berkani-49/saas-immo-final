// Fichier : src/pages/AnalyticsPage.jsx
// Tableau de bord avancé avec statistiques et graphiques

import React, { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  Card, CardBody, CardHeader, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td,
  Button, Icon, VStack, HStack, Badge, useToast
} from '@chakra-ui/react';
import { FiEye, FiTrendingUp, FiClock, FiUsers, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [properties, setProperties] = useState([]);
  const [trafficSources, setTrafficSources] = useState([]);
  const [devices, setDevices] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const [overviewRes, propertiesRes, trafficRes, devicesRes] = await Promise.all([
        axios.get('https://saas-immo.onrender.com/api/analytics/overview', config),
        axios.get('https://saas-immo.onrender.com/api/analytics/properties', config),
        axios.get('https://saas-immo.onrender.com/api/analytics/traffic-sources', config),
        axios.get('https://saas-immo.onrender.com/api/analytics/devices', config)
      ]);

      setOverview(overviewRes.data);
      setProperties(propertiesRes.data);
      setTrafficSources(trafficRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    toast({
      title: 'Export PDF',
      description: 'Fonctionnalité en cours de développement',
      status: 'info',
      duration: 3000
    });
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4}>Chargement des statistiques...</Text>
      </Box>
    );
  }

  // Préparer les données pour le graphique des vues par jour
  const viewsChartData = {
    labels: overview?.viewsByDay?.map(d => new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })) || [],
    datasets: [
      {
        label: 'Vues par jour',
        data: overview?.viewsByDay?.map(d => parseInt(d.count)) || [],
        borderColor: '#C6A87C',
        backgroundColor: 'rgba(198, 168, 124, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Données pour le graphique des sources de trafic
  const trafficChartData = {
    labels: trafficSources.map(s => s.source || 'Direct'),
    datasets: [
      {
        label: 'Nombre de vues',
        data: trafficSources.map(s => s.count),
        backgroundColor: [
          '#C6A87C',
          '#A38860',
          '#806845',
          '#D8B98E',
          '#EEDDC2'
        ]
      }
    ]
  };

  // Données pour le graphique des appareils
  const devicesChartData = {
    labels: devices.map(d => d.device),
    datasets: [
      {
        data: devices.map(d => d.count),
        backgroundColor: ['#C6A87C', '#A38860', '#806845']
      }
    ]
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">📈 Tableau de Bord Avancé</Heading>
          <Text color="gray.600">Statistiques des 30 derniers jours</Text>
        </VStack>
        <Button
          leftIcon={<Icon as={FiDownload} />}
          colorScheme="brand"
          onClick={exportPDF}
        >
          Exporter PDF
        </Button>
      </HStack>

      {/* Statistiques globales */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiEye} color="blue.500" />
                  <Text>Total des vues</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl">{overview?.totalViews || 0}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Derniers 30 jours
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiTrendingUp} color="green.500" />
                  <Text>Taux de conversion</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl">{overview?.conversionRate || 0}%</StatNumber>
              <StatHelpText>
                {overview?.conversions || 0} conversions
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiClock} color="orange.500" />
                  <Text>Temps moyen</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl">{overview?.avgDuration || 0}s</StatNumber>
              <StatHelpText>Par visite</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiUsers} color="purple.500" />
                  <Text>Biens actifs</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="3xl">{properties.length}</StatNumber>
              <StatHelpText>Avec statistiques</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Graphiques */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Graphique des vues par jour */}
        <Card>
          <CardHeader>
            <Heading size="md">📊 Vues par jour</Heading>
          </CardHeader>
          <CardBody>
            {overview?.viewsByDay?.length > 0 ? (
              <Line
                data={viewsChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            ) : (
              <Text color="gray.500" textAlign="center" py={10}>Aucune donnée disponible</Text>
            )}
          </CardBody>
        </Card>

        {/* Graphique des sources de trafic */}
        <Card>
          <CardHeader>
            <Heading size="md">🌐 Sources de trafic</Heading>
          </CardHeader>
          <CardBody>
            {trafficSources.length > 0 ? (
              <Bar
                data={trafficChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            ) : (
              <Text color="gray.500" textAlign="center" py={10}>Aucune donnée disponible</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Graphique des appareils + Top biens */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Répartition par appareil */}
        <Card>
          <CardHeader>
            <Heading size="md">📱 Répartition par appareil</Heading>
          </CardHeader>
          <CardBody>
            {devices.length > 0 ? (
              <Box maxW="300px" mx="auto">
                <Doughnut
                  data={devicesChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </Box>
            ) : (
              <Text color="gray.500" textAlign="center" py={10}>Aucune donnée disponible</Text>
            )}
          </CardBody>
        </Card>

        {/* Top 5 biens les plus vus */}
        <Card>
          <CardHeader>
            <Heading size="md">🏆 Top 5 biens les plus vus</Heading>
          </CardHeader>
          <CardBody>
            {properties.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {properties.slice(0, 5).map((property, index) => (
                  <HStack key={property.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <HStack>
                      <Badge colorScheme="brand" fontSize="lg">{index + 1}</Badge>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">{property.address}</Text>
                        <Text fontSize="xs" color="gray.600">{property.city}</Text>
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={0}>
                      <Text fontWeight="bold" color="brand.600">{property.recentViews}</Text>
                      <Text fontSize="xs" color="gray.500">vues</Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500" textAlign="center" py={10}>Aucun bien disponible</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tableau détaillé des biens */}
      <Card>
        <CardHeader>
          <Heading size="md">📋 Statistiques détaillées par bien</Heading>
        </CardHeader>
        <CardBody overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Bien</Th>
                <Th isNumeric>Prix</Th>
                <Th isNumeric>Vues (30j)</Th>
                <Th isNumeric>Temps moyen</Th>
                <Th isNumeric>Conversions</Th>
                <Th isNumeric>Taux</Th>
              </Tr>
            </Thead>
            <Tbody>
              {properties.map((property) => (
                <Tr key={property.id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">{property.address}</Text>
                      <Text fontSize="xs" color="gray.500">{property.city}</Text>
                    </VStack>
                  </Td>
                  <Td isNumeric fontWeight="bold">{property.price.toLocaleString()} €</Td>
                  <Td isNumeric>
                    <Badge colorScheme="blue">{property.recentViews}</Badge>
                  </Td>
                  <Td isNumeric>{property.avgDuration}s</Td>
                  <Td isNumeric>
                    <Badge colorScheme="green">{property.conversions}</Badge>
                  </Td>
                  <Td isNumeric fontWeight="bold" color={parseFloat(property.conversionRate) > 5 ? 'green.600' : 'gray.600'}>
                    {property.conversionRate}%
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Box>
  );
}
