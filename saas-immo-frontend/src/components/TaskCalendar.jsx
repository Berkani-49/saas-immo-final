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
      bg="white" 
      p={2} 
      borderRadius="lg" 
      shadow="sm" 
      borderWidth="1px"
      fontSize={{ base: "xs", md: "sm" }} // Texte global plus petit sur mobile
      sx={{
        // Petits ajustements CSS pour les boutons sur mobile
        ".rbc-toolbar button": {
            fontSize: { base: "10px", md: "14px" },
            padding: { base: "2px 5px", md: "5px 10px" }
        },
        ".rbc-toolbar-label": {
            fontSize: { base: "14px", md: "18px" },
            fontWeight: "bold"
        }
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