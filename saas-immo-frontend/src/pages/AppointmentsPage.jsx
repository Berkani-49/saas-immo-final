// Page : AppointmentsPage - Gestion des rendez-vous
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, VStack, HStack, Text, Badge, Button, Icon, useToast,
  Spinner, Center, Card, CardBody, Flex, Select, Divider
} from '@chakra-ui/react';
import { FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiCheck, FiX } from 'react-icons/fi';
import { API_URL } from '../config';

export default function AppointmentsPage({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const toast = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/api/appointments`, config);
      setAppointments(response.data);
    } catch (error) {
      console.error("Erreur chargement rendez-vous:", error);
      toast({ title: "Erreur", description: "Impossible de charger les rendez-vous.", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.patch(`${API_URL}/api/appointments/${id}`, { status: newStatus }, config);
      setAppointments(appointments.map(apt =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      ));
      const statusLabels = { 'CONFIRMED': 'confirmé', 'CANCELLED': 'annulé', 'PENDING': 'en attente' };
      toast({ title: "Statut mis à jour", description: `Le rendez-vous a été ${statusLabels[newStatus]}.`, status: "success" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", status: "error" });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'green';
      case 'CANCELLED': return 'red';
      case 'PENDING': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmé';
      case 'CANCELLED': return 'Annulé';
      case 'PENDING': return 'En attente';
      default: return status;
    }
  };

  const filteredAppointments = appointments.filter(apt =>
    filter === 'ALL' ? true : apt.status === filter
  );

  const now = new Date();
  const upcomingAppointments = filteredAppointments.filter(apt => new Date(apt.appointmentDate) >= now);
  const pastAppointments = filteredAppointments.filter(apt => new Date(apt.appointmentDate) < now);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length
  };

  if (loading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <VStack spacing={5} align="stretch">

        {/* Header + stats pills */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Heading size="lg" color="gray.800">Mes Rendez-vous</Heading>
          <Flex gap={2} flexWrap="wrap" align="center">
            <StatPill label="Total" value={stats.total} bg="blue.50" color="blue.700" />
            <StatPill label="En attente" value={stats.pending} bg="orange.50" color="orange.700" />
            <StatPill label="Confirmés" value={stats.confirmed} bg="green.50" color="green.700" />
            <StatPill label="Annulés" value={stats.cancelled} bg="red.50" color="red.700" />
          </Flex>
        </Flex>

        {/* Filtre */}
        <HStack spacing={3}>
          <Text fontWeight="semibold" color="gray.600" fontSize="sm">Filtrer :</Text>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} maxW="180px" size="sm">
            <option value="ALL">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmés</option>
            <option value="CANCELLED">Annulés</option>
          </Select>
        </HStack>

        {/* À venir */}
        {upcomingAppointments.length > 0 && (
          <Box>
            <Text fontWeight="semibold" color="brand.600" mb={3} fontSize="sm">
              📅 À venir ({upcomingAppointments.length})
            </Text>
            <VStack spacing={2} align="stretch">
              {upcomingAppointments.map(apt => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onUpdateStatus={updateStatus}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Passés */}
        {pastAppointments.length > 0 && (
          <Box>
            {upcomingAppointments.length > 0 && <Divider mb={4} />}
            <Text fontWeight="semibold" color="gray.500" mb={3} fontSize="sm">
              📋 Passés ({pastAppointments.length})
            </Text>
            <VStack spacing={2} align="stretch">
              {pastAppointments.map(apt => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onUpdateStatus={updateStatus}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  isPast={true}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Vide */}
        {filteredAppointments.length === 0 && (
          <Card bg="white" borderColor="gray.200">
            <CardBody>
              <Center py={10}>
                <VStack spacing={3}>
                  <Icon as={FiCalendar} w={10} h={10} color="gray.300" />
                  <Text color="gray.500">Aucun rendez-vous trouvé</Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Les clients pourront prendre rendez-vous depuis la page publique de vos biens.
                  </Text>
                </VStack>
              </Center>
            </CardBody>
          </Card>
        )}

      </VStack>
    </Box>
  );
}

function StatPill({ label, value, bg, color }) {
  return (
    <HStack bg={bg} px={3} py={1} borderRadius="full" spacing={2}>
      <Text fontSize="xs" color={color} opacity={0.8}>{label}</Text>
      <Text fontSize="sm" fontWeight="bold" color={color}>{value}</Text>
    </HStack>
  );
}

function AppointmentCard({ appointment, onUpdateStatus, getStatusColor, getStatusLabel, isPast = false }) {
  const date = new Date(appointment.appointmentDate);

  return (
    <Card
      borderWidth="1px"
      borderColor="gray.200"
      bg={isPast ? "gray.50" : "white"}
      opacity={isPast ? 0.85 : 1}
      shadow="sm"
    >
      <CardBody py={3} px={4}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap">

          {/* Gauche : date + client + notes */}
          <VStack align="start" spacing={1} flex={1} minW="220px">
            {/* Date + heure sur une ligne */}
            <HStack spacing={2}>
              <Icon as={FiCalendar} color="purple.500" w={4} h={4} />
              <Text fontWeight="bold" fontSize="sm" color="gray.800">
                {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
              <Icon as={FiClock} color="gray.400" w={3} h={3} />
              <Text fontSize="sm" color="gray.600">
                {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </HStack>

            {/* Client en une ligne */}
            <Flex gap={3} align="center" flexWrap="wrap">
              <HStack spacing={1}>
                <Icon as={FiUser} color="blue.400" w={3} h={3} />
                <Text fontSize="sm" fontWeight="semibold" color="gray.800">{appointment.clientName}</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiMail} color="gray.400" w={3} h={3} />
                <Text fontSize="xs" color="gray.500">{appointment.clientEmail}</Text>
              </HStack>
              {appointment.clientPhone && (
                <HStack spacing={1}>
                  <Icon as={FiPhone} color="gray.400" w={3} h={3} />
                  <Text fontSize="xs" color="gray.500">{appointment.clientPhone}</Text>
                </HStack>
              )}
            </Flex>

            {/* Notes compact */}
            {appointment.notes && (
              <Text fontSize="xs" color="gray.500" noOfLines={2} fontStyle="italic">
                "{appointment.notes}"
              </Text>
            )}
          </VStack>

          {/* Droite : badge + boutons */}
          <VStack align="end" spacing={2} flexShrink={0}>
            <Badge
              colorScheme={getStatusColor(appointment.status)}
              fontSize="xs"
              px={2} py={1}
              borderRadius="md"
            >
              {getStatusLabel(appointment.status)}
            </Badge>
            {appointment.status !== 'CANCELLED' && !isPast && (
              <HStack spacing={2}>
                {appointment.status !== 'CONFIRMED' && (
                  <Button
                    colorScheme="green"
                    size="xs"
                    leftIcon={<Icon as={FiCheck} />}
                    onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')}
                  >
                    Confirmer
                  </Button>
                )}
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="xs"
                  leftIcon={<Icon as={FiX} />}
                  onClick={() => onUpdateStatus(appointment.id, 'CANCELLED')}
                >
                  Annuler
                </Button>
              </HStack>
            )}
          </VStack>

        </Flex>
      </CardBody>
    </Card>
  );
}
