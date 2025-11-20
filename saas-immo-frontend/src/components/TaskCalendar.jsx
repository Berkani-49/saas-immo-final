// Fichier : src/components/TaskCalendar.jsx

import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr'; // Pour avoir le calendrier en français
import { Box } from '@chakra-ui/react';

// Configuration de la langue (Français)
moment.locale('fr');
const localizer = momentLocalizer(moment);

export default function TaskCalendar({ tasks }) {
  
  // On transforme tes "Tâches" en "Événements" pour le calendrier
  const events = tasks
    .filter(task => task.dueDate) // On ne prend que les tâches qui ont une date
    .map(task => {
      const date = new Date(task.dueDate);
      return {
        id: task.id,
        title: task.title,
        start: date,
        end: date, // Pour l'instant, ça dure "0 minute", ça s'affichera comme un point
        allDay: true, // On dit que c'est une tâche pour la journée
        status: task.status, // Pour la couleur
        resource: task
      };
    });

  // Fonction pour colorier les événements
  const eventStyleGetter = (event) => {
    const backgroundColor = event.status === 'DONE' ? '#48BB78' : '#805AD5'; // Vert si fait, Violet sinon
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <Box h="500px" bg="white" p={4} borderRadius="lg" shadow="md" borderWidth="1px">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        messages={{
          next: "Suivant",
          previous: "Précédent",
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda"
        }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'agenda']} // Les vues disponibles
      />
    </Box>
  );
}