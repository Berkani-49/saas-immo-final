// Page : AppointmentsPage - Gestion des rendez-vous
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, VStack, HStack, Text, Badge, Button, Icon, Grid, useToast,
  Spinner, Center, Card, CardBody, CardHeader, Flex, Select, Divider
} from '@chakra-ui/react';
import { FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { API_URL } from '../config';

export default function AppointmentsPage({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, CANCELLED
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

      // Mettre à jour l'état local
      setAppointments(appointments.map(apt =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      ));

      const statusLabels = {
        'CONFIRMED': 'confirmé',
        'CANCELLED': 'annulé',
        'PENDING': 'en attente'
      };

      toast({
        title: "Statut mis à jour",
        description: `Le rendez-vous a été ${statusLabels[newStatus]}.`,
        status: "success"
      });
    } catch (error) {
      console.error("Erreur mise à jour:", error);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED': return FiCheck;
      case 'CANCELLED': return FiX;
      case 'PENDING': return FiAlertCircle;
      default: return FiCalendar;
    }
  };

  // Filtrer les rendez-vous
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'ALL') return true;
    return apt.status === filter;
  });

  // Séparer les rendez-vous passés et à venir
  const now = new Date();
  const upcomingAppointments = filteredAppointments.filter(apt => new Date(apt.appointmentDate) >= now);
  const pastAppointments = filteredAppointments.filter(apt => new Date(apt.appointmentDate) < now);

  // Statistiques
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length
  };

  if (loading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">

        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="lg" color="gray.800">
            <Icon as={FiCalendar} mr={2} />
            Mes Rendez-vous
          </Heading>
        </Flex>

        {/* Statistiques */}
        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="blue.400">{stats.total}</Text>
              <Text fontSize="sm" color="gray.600">Total</Text>
            </CardBody>
          </Card>
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="orange.400">{stats.pending}</Text>
              <Text fontSize="sm" color="gray.600">En attente</Text>
            </CardBody>
          </Card>
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="green.400">{stats.confirmed}</Text>
              <Text fontSize="sm" color="gray.600">Confirmés</Text>
            </CardBody>
          </Card>
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="red.400">{stats.cancelled}</Text>
              <Text fontSize="sm" color="gray.600">Annulés</Text>
            </CardBody>
          </Card>
        </Grid>

        {/* Filtre */}
        <HStack spacing={4}>
          <Text fontWeight="semibold" color="gray.600">Filtrer :</Text>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} maxW="200px" size="sm">
            <option value="ALL">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmés</option>
            <option value="CANCELLED">Annulés</option>
          </Select>
        </HStack>

        {/* Rendez-vous à venir */}
        {upcomingAppointments.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color="brand.400">
              📅 À venir ({upcomingAppointments.length})
            </Heading>
            <VStack spacing={4} align="stretch">
              {upcomingAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onUpdateStatus={updateStatus}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Rendez-vous passés */}
        {pastAppointments.length > 0 && (
          <Box>
            <Divider my={6} />
            <Heading size="md" mb={4} color="gray.600">
              📋 Passés ({pastAppointments.length})
            </Heading>
            <VStack spacing={4} align="stretch">
              {pastAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onUpdateStatus={updateStatus}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  getStatusIcon={getStatusIcon}
                  isPast={true}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Aucun rendez-vous */}
        {filteredAppointments.length === 0 && (
          <Card bg="white" borderColor="gray.200">
            <CardBody>
              <Center py={10}>
                <VStack spacing={4}>
                  <Icon as={FiCalendar} w={16} h={16} color="gray.500" />
                  <Text fontSize="lg" color="gray.600">Aucun rendez-vous trouvé</Text>
                  <Text fontSize="sm" color="gray.500">
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

// Composant pour afficher une carte de rendez-vous
function AppointmentCard({ appointment, onUpdateStatus, getStatusColor, getStatusLabel, getStatusIcon, isPast = false }) {
  const date = new Date(appointment.appointmentDate);
  const StatusIcon = getStatusIcon(appointment.status);

  return (
    <Card
      shadow="md"
      borderWidth="1px"
      borderColor="gray.200"
      bg={isPast ? "gray.100" : "white"}
      opacity={isPast ? 0.8 : 1}
    >
      <CardBody>
        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6}>

          {/* Informations principales */}
          <VStack align="stretch" spacing={3}>

            {/* Date et heure */}
            <HStack spacing={4}>
              <Icon as={FiCalendar} color="purple.500" w={5} h={5} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg" color="gray.800">
                  {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <HStack>
                  <Icon as={FiClock} color="gray.600" w={4} h={4} />
                  <Text color="gray.600" fontSize="md">
                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <Divider />

            {/* Informations client */}
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Icon as={FiUser} color="blue.400" w={4} h={4} />
                <Text fontWeight="semibold" color="gray.800">{appointment.clientName}</Text>
              </HStack>
              <HStack>
                <Icon as={FiMail} color="gray.600" w={4} h={4} />
                <Text fontSize="sm" color="gray.600">{appointment.clientEmail}</Text>
              </HStack>
              {appointment.clientPhone && (
                <HStack>
                  <Icon as={FiPhone} color="gray.600" w={4} h={4} />
                  <Text fontSize="sm" color="gray.600">{appointment.clientPhone}</Text>
                </HStack>
              )}
            </VStack>

            {/* Notes */}
            {appointment.notes && (
              <Box bg="gray.50" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.300">
                <Text fontSize="sm" fontWeight="semibold" color="blue.600" mb={1}>Message :</Text>
                <Text fontSize="sm" color="gray.600">{appointment.notes}</Text>
              </Box>
            )}
          </VStack>

          {/* Actions et statut */}
          <VStack align="stretch" spacing={4} justify="space-between">

            {/* Badge de statut */}
            <Badge
              colorScheme={getStatusColor(appointment.status)}
              fontSize="md"
              px={3}
              py={2}
              borderRadius="md"
              textAlign="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
            >
              <Icon as={StatusIcon} />
              {getStatusLabel(appointment.status)}
            </Badge>

            {/* Boutons d'action (seulement si pas annulé et pas passé) */}
            {appointment.status !== 'CANCELLED' && !isPast && (
              <VStack spacing={2}>
                {appointment.status !== 'CONFIRMED' && (
                  <Button
                    colorScheme="green"
                    size="sm"
                    width="full"
                    leftIcon={<Icon as={FiCheck} />}
                    onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')}
                  >
                    Confirmer
                  </Button>
                )}
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  width="full"
                  leftIcon={<Icon as={FiX} />}
                  onClick={() => onUpdateStatus(appointment.id, 'CANCELLED')}
                >
                  Annuler
                </Button>
              </VStack>
            )}

            {/* Date de création */}
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Reçu le {new Date(appointment.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </VStack>

        </Grid>
      </CardBody>
    </Card>
  );
}
