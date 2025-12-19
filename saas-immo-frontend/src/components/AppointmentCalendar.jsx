// Composant : AppointmentCalendar - Calendrier de prise de RDV
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, VStack, HStack, Button, Grid, Text, Heading, FormControl, FormLabel, Input, Textarea,
  useToast, Badge, Spinner, Center, Icon
} from '@chakra-ui/react';
import { FiCalendar, FiClock, FiCheck, FiDownload } from 'react-icons/fi';

export default function AppointmentCalendar({ agentId }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentCreated, setAppointmentCreated] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState('');

  const toast = useToast();

  // Générer les 7 prochains jours (sauf dimanche)
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    let count = 0;
    let offset = 0;

    while (count < 7) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      // Skip dimanche (0 = dimanche)
      if (date.getDay() !== 0) {
        days.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        });
        count++;
      }
      offset++;
    }
    return days;
  };

  const nextDays = getNextDays();

  // Charger les créneaux disponibles quand une date est sélectionnée
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability();
    }
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://saas-immo.onrender.com/api/public/agents/${agentId}/availability`,
        { params: { date: selectedDate } }
      );
      setAvailableSlots(response.data.slots);
    } catch (error) {
      console.error("Erreur récupération disponibilités:", error);
      toast({ title: "Erreur", description: "Impossible de charger les disponibilités.", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientName || !clientEmail || !selectedSlot) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs requis.", status: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `https://saas-immo.onrender.com/api/public/agents/${agentId}/appointments`,
        {
          clientName,
          clientEmail,
          clientPhone,
          date: selectedDate,
          time: selectedSlot,
          notes
        }
      );

      // Récupérer l'URL du calendrier depuis la réponse
      if (response.data.calendarUrl) {
        setCalendarUrl(response.data.calendarUrl);
      }

      setAppointmentCreated(true);
      toast({
        title: "Rendez-vous confirmé !",
        description: `Votre RDV est prévu le ${new Date(selectedDate).toLocaleDateString('fr-FR')} à ${selectedSlot}`,
        status: "success",
        duration: 5000
      });

      // Reset
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setNotes('');
      setSelectedSlot(null);

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Impossible de créer le rendez-vous.";
      toast({ title: "Erreur", description: errorMsg, status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (appointmentCreated) {
    return (
      <Box textAlign="center" py={10} px={6} bg="green.50" borderRadius="xl" borderWidth="1px" borderColor="green.200">
        <Icon as={FiCheck} w={16} h={16} color="green.500" mb={4} />
        <Heading size="lg" color="green.700" mb={2}>Rendez-vous confirmé !</Heading>
        <Text fontSize="lg" color="gray.700" mb={4}>
          Votre rendez-vous a été réservé pour le <strong>{new Date(selectedDate).toLocaleDateString('fr-FR')}</strong> à <strong>{selectedSlot}</strong>.
        </Text>
        <Text color="gray.600" mb={6}>Vous recevrez un email de confirmation à {clientEmail}.</Text>

        {/* Bouton pour ajouter au calendrier */}
        {calendarUrl && (
          <VStack spacing={3} mb={6}>
            <Text fontWeight="semibold" color="purple.700" fontSize="md">
              📅 Ajoutez ce rendez-vous à votre calendrier
            </Text>
            <HStack spacing={3}>
              <Button
                as="a"
                href={calendarUrl}
                download
                colorScheme="purple"
                leftIcon={<FiDownload />}
                size="lg"
              >
                Télécharger (.ics)
              </Button>
              <Button
                as="a"
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Rendez-vous immobilier')}&dates=${selectedDate.replace(/-/g, '')}T${selectedSlot.replace(':', '')}00/${selectedDate.replace(/-/g, '')}T${(parseInt(selectedSlot.split(':')[0]) + 1).toString().padStart(2, '0')}${selectedSlot.split(':')[1]}00&details=${encodeURIComponent('Rendez-vous confirmé via ImmoPro')}`}
                target="_blank"
                colorScheme="blue"
                leftIcon={<FiCalendar />}
                size="lg"
              >
                Google Calendar
              </Button>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              Compatible avec Google Calendar, Outlook, Apple Calendar, et tous les calendriers
            </Text>
          </VStack>
        )}

        <Button mt={4} colorScheme="green" variant="outline" onClick={() => setAppointmentCreated(false)}>
          Prendre un autre rendez-vous
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4} color="purple.700">
        <Icon as={FiCalendar} mr={2} />
        Prendre rendez-vous
      </Heading>
      <Text mb={6} color="gray.600">
        Choisissez un créneau disponible pour rencontrer notre agent.
      </Text>

      {/* Sélection de la date */}
      <VStack spacing={6} align="stretch">
        <Box>
          <FormLabel fontWeight="bold" mb={3}>1. Choisissez une date</FormLabel>
          <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" }} gap={3}>
            {nextDays.map(day => (
              <Button
                key={day.date}
                variant={selectedDate === day.date ? 'solid' : 'outline'}
                colorScheme={selectedDate === day.date ? 'purple' : 'gray'}
                onClick={() => {
                  setSelectedDate(day.date);
                  setSelectedSlot(null); // Reset le créneau sélectionné
                }}
                size="md"
                h="auto"
                py={3}
                flexDir="column"
              >
                <Text fontSize="xs" opacity={0.8}>{day.label.split(' ')[0]}</Text>
                <Text fontSize="lg" fontWeight="bold">{day.label.split(' ')[1]}</Text>
              </Button>
            ))}
          </Grid>
        </Box>

        {/* Sélection du créneau horaire */}
        {selectedDate && (
          <Box>
            <FormLabel fontWeight="bold" mb={3}>
              <Icon as={FiClock} mr={1} />
              2. Choisissez un créneau horaire
            </FormLabel>

            {loading ? (
              <Center py={8}>
                <Spinner size="lg" color="purple.500" />
              </Center>
            ) : (
              <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap={3}>
                {availableSlots.map(slot => (
                  <Button
                    key={slot.time}
                    variant={selectedSlot === slot.time ? 'solid' : 'outline'}
                    colorScheme={slot.available ? (selectedSlot === slot.time ? 'purple' : 'gray') : 'red'}
                    onClick={() => slot.available && setSelectedSlot(slot.time)}
                    isDisabled={!slot.available}
                    size="lg"
                    position="relative"
                  >
                    {slot.time}
                    {!slot.available && (
                      <Badge
                        position="absolute"
                        top="-2"
                        right="-2"
                        colorScheme="red"
                        fontSize="xx-small"
                      >
                        Occupé
                      </Badge>
                    )}
                  </Button>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Formulaire de contact */}
        {selectedSlot && (
          <Box bg="purple.50" p={6} borderRadius="xl" borderWidth="1px" borderColor="purple.200">
            <FormLabel fontWeight="bold" mb={4} fontSize="lg">3. Vos informations</FormLabel>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <HStack w="full" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Nom complet</FormLabel>
                    <Input
                      bg="white"
                      placeholder="Jean Dupont"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </FormControl>
                </HStack>

                <HStack w="full" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Email</FormLabel>
                    <Input
                      type="email"
                      bg="white"
                      placeholder="jean.dupont@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Téléphone</FormLabel>
                    <Input
                      type="tel"
                      bg="white"
                      placeholder="06 12 34 56 78"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel fontSize="sm">Message (optionnel)</FormLabel>
                  <Textarea
                    bg="white"
                    placeholder="Dites-nous en plus sur votre projet..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </FormControl>

                <Box w="full" pt={2}>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    Récapitulatif : <strong>{new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> à <strong>{selectedSlot}</strong>
                  </Text>
                  <Button
                    type="submit"
                    colorScheme="purple"
                    size="lg"
                    width="full"
                    isLoading={isSubmitting}
                    leftIcon={<FiCheck />}
                  >
                    Confirmer le rendez-vous
                  </Button>
                </Box>
              </VStack>
            </form>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
