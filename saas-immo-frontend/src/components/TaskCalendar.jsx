// Fichier : src/components/TaskCalendar.jsx

import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import { Box, useBreakpointValue } from '@chakra-ui/react'; // Import du détecteur d'écran

moment.locale('fr');
const localizer = momentLocalizer(moment);

export default function TaskCalendar({ tasks }) {
  
  // --- DÉTECTION MOBILE ---
  // Sur mobile ('base'), on force la vue 'agenda'. Sur ordi ('md'), on met 'month'.
  const defaultView = useBreakpointValue({ base: 'agenda', md: 'month' });
  
  // On adapte aussi la hauteur : plus petit sur mobile pour éviter le scroll infini
  const calendarHeight = useBreakpointValue({ base: '70vh', md: '500px' });

  const events = tasks
    .filter(task => task.dueDate)
    .map(task => {
      const date = new Date(task.dueDate);
      return {
        id: task.id,
        title: task.title,
        start: date,
        end: date,
        allDay: true,
        status: task.status,
        resource: task
      };
    });

  const eventStyleGetter = (event) => {
    const backgroundColor = event.status === 'DONE' ? '#48BB78' : '#805AD5';
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85em' // Texte un peu plus petit pour tenir
      }
    };
  };

  return (
    <Box 
      h={calendarHeight} 
      bg="gray.800"
      p={2}
      borderRadius="lg"
      shadow="sm"
      borderWidth="1px"
      borderColor="gray.700"
      fontSize={{ base: "xs", md: "sm" }}
      sx={{
        ".rbc-toolbar button": {
            fontSize: { base: "10px", md: "14px" },
            padding: { base: "2px 5px", md: "5px 10px" },
            color: "white",
            border: "1px solid #4A5568",
        },
        ".rbc-toolbar-label": {
            fontSize: { base: "14px", md: "18px" },
            fontWeight: "bold",
            color: "white",
        },
        ".rbc-header": { color: "#A0AEC0", borderColor: "#4A5568" },
        ".rbc-off-range-bg": { bg: "#1A202C" },
        ".rbc-today": { bg: "#2D3748" },
        ".rbc-month-view, .rbc-time-view, .rbc-agenda-view": { borderColor: "#4A5568" },
        ".rbc-month-row, .rbc-day-bg, .rbc-header": { borderColor: "#4A5568" },
        ".rbc-date-cell": { color: "#E2E8F0" },
        ".rbc-off-range": { color: "#718096" },
        ".rbc-agenda-table, .rbc-agenda-date-cell, .rbc-agenda-time-cell, .rbc-agenda-event-cell": { color: "#E2E8F0" },
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        defaultView={defaultView} // <-- C'est ici que la magie opère
        messages={{
          next: "Suiv.",
          previous: "Préc.",
          today: "Auj.",
          month: "Mois",
          week: "Sem.",
          day: "Jour",
          agenda: "Liste",
          noEventsInRange: "Aucune tâche sur cette période."
        }}
        eventPropGetter={eventStyleGetter}
        // Sur mobile, on ne propose que Agenda et Jour pour éviter la casse
        views={['month', 'week', 'day', 'agenda']} 
      />
    </Box>
  );
}