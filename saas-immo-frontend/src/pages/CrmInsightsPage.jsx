// Fichier : src/pages/CrmInsightsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, SimpleGrid, Text, Spinner, Flex, Icon, Badge,
  Card, CardBody, CardHeader, VStack, HStack, Stat, StatLabel,
  StatNumber, StatHelpText, Progress, Button, Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import {
  FiUsers, FiHome, FiCheckSquare, FiCalendar,
  FiTrendingUp, FiDollarSign, FiMapPin, FiAlertCircle
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { API_URL } from '../config';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

const CHART_COLORS = {
  indigo: '#6366F1',
  indigoLight: 'rgba(99,102,241,0.12)',
  emerald: '#10B981',
  emeraldLight: 'rgba(16,185,129,0.12)',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  rose: '#F43F5E',
  slate: '#64748B',
};

const chartDefaults = {
  scales: {
    y: { beginAtZero: true, ticks: { color: '#94A3B8' }, grid: { color: 'rgba(0,0,0,0.04)' } },
    x: { ticks: { color: '#94A3B8' }, grid: { display: false } },
  },
  plugins: { legend: { display: false } },
  responsive: true,
};

function KpiCard({ icon, label, value, sub, color = 'brand' }) {
  return (
    <Card bg="white" borderWidth="1px" borderColor="gray.100" shadow="sm">
      <CardBody>
        <Flex align="center" gap={4}>
          <Box
            p={3} borderRadius="xl"
            bg={`${color}.50`} color={`${color}.600`}
            flexShrink={0}
          >
            <Icon as={icon} w={5} h={5} />
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">{label}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1.2">{value}</Text>
            {sub && <Text fontSize="xs" color="gray.400" mt="1px">{sub}</Text>}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <Card bg="white" borderWidth="1px" borderColor="gray.100" shadow="sm">
      <CardHeader pb={2}>
        <HStack spacing={2}>
          <Icon as={icon} color="brand.500" w={4} h={4} />
          <Heading size="sm" color="gray.700">{title}</Heading>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>{children}</CardBody>
    </Card>
  );
}

export default function CrmInsightsPage({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/crm-insights`, config);
      setData(res.data);
    } catch (e) {
      console.error('Erreur CRM insights:', e);
      const msg = e.response?.data?.error || e.message || 'Erreur inconnue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  if (loading) return (
    <Flex justify="center" align="center" h="50vh">
      <Spinner size="xl" color="brand.500" />
    </Flex>
  );

  if (error) return (
    <Box py={10}>
      <Alert status="error" borderRadius="xl" flexDirection="column" alignItems="center" textAlign="center" py={8}>
        <AlertIcon boxSize={8} mb={3} />
        <AlertTitle mb={1}>Impossible de charger les insights</AlertTitle>
        <AlertDescription color="gray.600" mb={4}>{error}</AlertDescription>
        <Button colorScheme="red" variant="outline" onClick={loadData}>
          Réessayer
        </Button>
      </Alert>
    </Box>
  );

  if (!data) return (
    <Flex justify="center" align="center" h="50vh">
      <Text color="gray.500">Aucune donnée disponible.</Text>
    </Flex>
  );

  const { contacts, properties, tasks, appointments } = data;

  // Graphique contacts par mois
  const contactsMonthChart = {
    labels: contacts.byMonth.map(m => m.label),
    datasets: [
      {
        label: 'Acheteurs',
        data: contacts.byMonth.map(m => m.buyers),
        borderColor: CHART_COLORS.indigo,
        backgroundColor: CHART_COLORS.indigoLight,
        tension: 0.4, fill: true, pointRadius: 4,
      },
      {
        label: 'Vendeurs',
        data: contacts.byMonth.map(m => m.sellers),
        borderColor: CHART_COLORS.emerald,
        backgroundColor: CHART_COLORS.emeraldLight,
        tension: 0.4, fill: true, pointRadius: 4,
      },
    ],
  };

  // Graphique budgets acheteurs
  const budgetChart = {
    labels: contacts.budgetRanges.map(r => r.label),
    datasets: [{
      data: contacts.budgetRanges.map(r => r.count),
      backgroundColor: [
        CHART_COLORS.indigo, CHART_COLORS.violet, CHART_COLORS.emerald,
        CHART_COLORS.amber, CHART_COLORS.rose, CHART_COLORS.slate,
      ],
    }],
  };

  // Graphique biens par mois
  const propertiesMonthChart = {
    labels: properties.byMonth.map(m => m.label),
    datasets: [{
      label: 'Biens ajoutés',
      data: properties.byMonth.map(m => m.count),
      backgroundColor: CHART_COLORS.indigo,
      borderRadius: 6,
    }],
  };

  // Graphique types de biens
  const propertyTypeChart = {
    labels: properties.byType.map(t => t.type),
    datasets: [{
      data: properties.byType.map(t => t.count),
      backgroundColor: [
        CHART_COLORS.indigo, CHART_COLORS.emerald, CHART_COLORS.amber,
        CHART_COLORS.violet, CHART_COLORS.rose, CHART_COLORS.slate,
      ],
    }],
  };

  // Graphique RDV par mois
  const appointmentsMonthChart = {
    labels: appointments.byMonth.map(m => m.label),
    datasets: [{
      label: 'Rendez-vous',
      data: appointments.byMonth.map(m => m.count),
      backgroundColor: CHART_COLORS.violet,
      borderRadius: 6,
    }],
  };

  const typeLabels = {
    APARTMENT: 'Appartement', HOUSE: 'Maison', STUDIO: 'Studio',
    LOFT: 'Loft', LAND: 'Terrain', COMMERCIAL: 'Commercial',
    PARKING: 'Parking',
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading fontSize="2xl" color="gray.800">Insights CRM</Heading>
          <Text color="gray.500" fontSize="sm" mt={1}>Analyse approfondie de votre activité</Text>
        </Box>
      </Flex>

      {/* KPIs globaux */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
        <KpiCard
          icon={FiUsers} label="Contacts"
          value={contacts.total}
          sub={`${contacts.buyers} acheteurs · ${contacts.sellers} vendeurs`}
          color="brand"
        />
        <KpiCard
          icon={FiHome} label="Biens"
          value={properties.total}
          sub={`Valeur moy. ${(properties.avgPrice / 1000).toFixed(0)}k€`}
          color="green"
        />
        <KpiCard
          icon={FiCheckSquare} label="Tâches"
          value={`${tasks.completionRate}%`}
          sub={`${tasks.done} complétées · ${tasks.overdue} en retard`}
          color="purple"
        />
        <KpiCard
          icon={FiCalendar} label="Rendez-vous"
          value={appointments.total}
          sub={`${appointments.confirmed} confirmés`}
          color="orange"
        />
      </SimpleGrid>

      {/* Ligne 1 : Contacts par mois + Budgets acheteurs */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <SectionCard title="Nouveaux contacts par mois" icon={FiTrendingUp}>
          <Box mb={3}>
            <HStack spacing={4}>
              <HStack spacing={1}>
                <Box w={3} h={3} borderRadius="full" bg={CHART_COLORS.indigo} />
                <Text fontSize="xs" color="gray.500">Acheteurs</Text>
              </HStack>
              <HStack spacing={1}>
                <Box w={3} h={3} borderRadius="full" bg={CHART_COLORS.emerald} />
                <Text fontSize="xs" color="gray.500">Vendeurs</Text>
              </HStack>
            </HStack>
          </Box>
          <Line
            data={contactsMonthChart}
            options={{
              ...chartDefaults,
              plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false },
              },
            }}
          />
        </SectionCard>

        <SectionCard title="Distribution budgets acheteurs" icon={FiDollarSign}>
          {contacts.budgetRanges.every(r => r.count === 0) ? (
            <Flex align="center" justify="center" h="160px">
              <Text color="gray.400" fontSize="sm">Aucun budget renseigné</Text>
            </Flex>
          ) : (
            <Box maxW="260px" mx="auto">
              <Doughnut
                data={budgetChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#64748B', font: { size: 11 } } },
                  },
                  cutout: '65%',
                }}
              />
            </Box>
          )}
        </SectionCard>
      </SimpleGrid>

      {/* Ligne 2 : Top villes + Types de biens */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <SectionCard title="Top villes demandées (acheteurs)" icon={FiMapPin}>
          {contacts.topCities.length === 0 ? (
            <Flex align="center" justify="center" h="120px">
              <Text color="gray.400" fontSize="sm">Aucune préférence de ville renseignée</Text>
            </Flex>
          ) : (
            <VStack align="stretch" spacing={3}>
              {contacts.topCities.map((item, i) => (
                <Box key={item.city}>
                  <Flex justify="space-between" mb={1}>
                    <HStack spacing={2}>
                      <Badge colorScheme="brand" variant="subtle" fontSize="xs">{i + 1}</Badge>
                      <Text fontSize="sm" fontWeight="500" color="gray.700">{item.city}</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="600" color="brand.600">{item.count}</Text>
                  </Flex>
                  <Progress
                    value={(item.count / contacts.topCities[0].count) * 100}
                    size="xs" colorScheme="brand" borderRadius="full"
                  />
                </Box>
              ))}
            </VStack>
          )}
        </SectionCard>

        <SectionCard title="Répartition du portefeuille" icon={FiHome}>
          {properties.byType.length === 0 ? (
            <Flex align="center" justify="center" h="160px">
              <Text color="gray.400" fontSize="sm">Aucun bien enregistré</Text>
            </Flex>
          ) : (
            <Box maxW="260px" mx="auto">
              <Doughnut
                data={{
                  ...propertyTypeChart,
                  labels: properties.byType.map(t => typeLabels[t.type] || t.type),
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#64748B', font: { size: 11 } } },
                  },
                  cutout: '65%',
                }}
              />
            </Box>
          )}
        </SectionCard>
      </SimpleGrid>

      {/* Ligne 3 : Biens ajoutés par mois + RDV par mois */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <SectionCard title="Biens ajoutés par mois" icon={FiHome}>
          <Bar data={propertiesMonthChart} options={chartDefaults} />
        </SectionCard>

        <SectionCard title="Rendez-vous par mois" icon={FiCalendar}>
          <Bar data={appointmentsMonthChart} options={chartDefaults} />
        </SectionCard>
      </SimpleGrid>

      {/* Ligne 4 : Tâches + Portefeuille + RDV statuts */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        {/* Tâches */}
        <SectionCard title="Performance des tâches" icon={FiCheckSquare}>
          <VStack spacing={4}>
            <Box w="full">
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" color="gray.600">Taux de complétion</Text>
                <Text fontSize="sm" fontWeight="bold" color="green.600">{tasks.completionRate}%</Text>
              </Flex>
              <Progress value={tasks.completionRate} colorScheme="green" borderRadius="full" size="sm" />
            </Box>
            <SimpleGrid columns={3} w="full" gap={2}>
              {[
                { label: 'Total', value: tasks.total, color: 'gray.700' },
                { label: 'Faites', value: tasks.done, color: 'green.600' },
                { label: 'En attente', value: tasks.pending, color: 'orange.500' },
              ].map(item => (
                <Box key={item.label} textAlign="center" p={2} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xl" fontWeight="bold" color={item.color}>{item.value}</Text>
                  <Text fontSize="10px" color="gray.500">{item.label}</Text>
                </Box>
              ))}
            </SimpleGrid>
            {tasks.overdue > 0 && (
              <HStack p={2} bg="red.50" borderRadius="md" w="full">
                <Icon as={FiAlertCircle} color="red.500" w={4} h={4} />
                <Text fontSize="sm" color="red.600" fontWeight="500">
                  {tasks.overdue} tâche{tasks.overdue > 1 ? 's' : ''} en retard
                </Text>
              </HStack>
            )}
          </VStack>
        </SectionCard>

        {/* Portefeuille */}
        <SectionCard title="Valeur du portefeuille" icon={FiDollarSign}>
          <VStack spacing={3} align="stretch">
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">Valeur totale</StatLabel>
              <StatNumber fontSize="xl" color="gray.800">
                {(properties.portfolioValue / 1000000).toFixed(2)}M€
              </StatNumber>
              <StatHelpText color="gray.400">{properties.total} biens</StatHelpText>
            </Stat>
            <Box h="1px" bg="gray.100" />
            <SimpleGrid columns={2} gap={3}>
              <Box>
                <Text fontSize="xs" color="gray.500">Prix moyen</Text>
                <Text fontSize="md" fontWeight="bold" color="gray.700">
                  {(properties.avgPrice / 1000).toFixed(0)}k€
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Prix/m² moyen</Text>
                <Text fontSize="md" fontWeight="bold" color="gray.700">
                  {properties.avgPricePerSqm.toLocaleString()}€
                </Text>
              </Box>
            </SimpleGrid>
            {properties.byCity.length > 0 && (
              <>
                <Box h="1px" bg="gray.100" />
                <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                  Top villes
                </Text>
                {properties.byCity.slice(0, 3).map(item => (
                  <Flex key={item.city} justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.600">{item.city}</Text>
                    <Badge colorScheme="brand" variant="subtle">{item.count} bien{item.count > 1 ? 's' : ''}</Badge>
                  </Flex>
                ))}
              </>
            )}
          </VStack>
        </SectionCard>

        {/* Rendez-vous statuts */}
        <SectionCard title="Statut des rendez-vous" icon={FiCalendar}>
          <VStack spacing={3} align="stretch">
            {[
              { label: 'Confirmés', value: appointments.confirmed, total: appointments.total, color: 'green' },
              { label: 'En attente', value: appointments.pending, total: appointments.total, color: 'orange' },
              { label: 'Annulés', value: appointments.cancelled, total: appointments.total, color: 'red' },
            ].map(item => (
              <Box key={item.label}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">{item.label}</Text>
                  <Text fontSize="sm" fontWeight="bold" color={`${item.color}.600`}>{item.value}</Text>
                </Flex>
                <Progress
                  value={appointments.total > 0 ? (item.value / appointments.total) * 100 : 0}
                  colorScheme={item.color} size="xs" borderRadius="full"
                />
              </Box>
            ))}
            <Box h="1px" bg="gray.100" />
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.500">Total</Text>
              <Text fontSize="sm" fontWeight="bold" color="gray.700">{appointments.total}</Text>
            </Flex>
          </VStack>
        </SectionCard>
      </SimpleGrid>
    </Box>
  );
}
