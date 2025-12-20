// Service pour gérer les notifications push Web Push
const webPush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration VAPID (Voluntary Application Server Identification)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BB1JEDGe00yOiEIMn3osnjOZrHtOhczhyHYluOhD3Q5Zjm9kToPunijcV-zsA_qG11xetHAZdbEEzxKqv7Mmz_I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'e3qtvqbWmWCixqfHki_yL5vAqLCTwX8tA1hmVsjkoNs';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@immopro.com';

webPush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Enregistre un abonnement push pour un utilisateur
 */
async function savePushSubscription(userId, subscription) {
  try {
    // Vérifier si l'abonnement existe déjà
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        agentId: userId,
        endpoint: subscription.endpoint
      }
    });

    if (existing) {
      console.log(`✅ Abonnement push déjà existant pour l'agent ${userId}`);
      return existing;
    }

    // Créer un nouvel abonnement
    const pushSubscription = await prisma.pushSubscription.create({
      data: {
        agentId: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    console.log(`✅ Nouvel abonnement push créé pour l'agent ${userId}`);
    return pushSubscription;
  } catch (error) {
    console.error('❌ Erreur sauvegarde abonnement push:', error);
    throw error;
  }
}

/**
 * Supprime un abonnement push
 */
async function removePushSubscription(userId, endpoint) {
  try {
    await prisma.pushSubscription.deleteMany({
      where: {
        agentId: userId,
        endpoint: endpoint
      }
    });

    console.log(`✅ Abonnement push supprimé pour l'agent ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression abonnement push:', error);
    throw error;
  }
}

/**
 * Envoie une notification push à un utilisateur spécifique
 */
async function sendPushNotificationToUser(userId, payload) {
  try {
    // Récupérer tous les abonnements de l'utilisateur
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { agentId: userId }
    });

    if (subscriptions.length === 0) {
      console.log(`⚠️  Aucun abonnement push pour l'agent ${userId}`);
      return { success: false, message: 'No subscriptions' };
    }

    const pushPayload = JSON.stringify(payload);
    const results = [];

    // Envoyer la notification à tous les appareils de l'utilisateur
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webPush.sendNotification(pushSubscription, pushPayload);
        results.push({ endpoint: sub.endpoint, success: true });
        console.log(`✅ Notification envoyée à l'agent ${userId}`);
      } catch (error) {
        console.error(`❌ Erreur envoi notification à ${sub.endpoint}:`, error);

        // Si l'abonnement est invalide (410 Gone), le supprimer
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          console.log(`🗑️  Abonnement invalide supprimé: ${sub.endpoint}`);
        }

        results.push({ endpoint: sub.endpoint, success: false, error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('❌ Erreur sendPushNotificationToUser:', error);
    throw error;
  }
}

/**
 * Envoie une notification push à tous les agents d'une équipe
 */
async function sendPushNotificationToTeam(teamId, payload) {
  try {
    // Récupérer tous les agents de l'équipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (!team) {
      throw new Error('Équipe introuvable');
    }

    const results = [];
    for (const member of team.members) {
      const result = await sendPushNotificationToUser(member.agentId, payload);
      results.push({ agentId: member.agentId, ...result });
    }

    return { success: true, results };
  } catch (error) {
    console.error('❌ Erreur sendPushNotificationToTeam:', error);
    throw error;
  }
}

/**
 * Template : Notification de nouveau rendez-vous
 */
function createAppointmentNotification(appointment, agent) {
  const date = new Date(appointment.appointmentDate);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    title: '📅 Nouveau rendez-vous',
    body: `${appointment.clientName} le ${formattedDate} à ${formattedTime}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `appointment-${appointment.id}`,
    data: {
      url: '/appointments',
      appointmentId: appointment.id
    },
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Voir'
      }
    ]
  };
}

/**
 * Template : Notification de nouveau bien matching
 */
function createPropertyMatchNotification(property, matchScore) {
  return {
    title: `🏠 Nouveau bien à ${property.city}`,
    body: `${property.price.toLocaleString()}€ - ${property.bedrooms} ch. - ${matchScore}% de compatibilité`,
    icon: property.imageUrl || '/logo.png',
    badge: '/logo.png',
    tag: `property-${property.id}`,
    data: {
      url: `/properties/${property.id}`,
      propertyId: property.id
    },
    requireInteraction: false
  };
}

/**
 * Template : Rappel de rendez-vous
 */
function createAppointmentReminderNotification(appointment) {
  const date = new Date(appointment.appointmentDate);
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    title: '⏰ Rappel de rendez-vous',
    body: `Rendez-vous avec ${appointment.clientName} à ${formattedTime}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `reminder-${appointment.id}`,
    data: {
      url: '/appointments',
      appointmentId: appointment.id
    },
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Voir'
      }
    ]
  };
}

/**
 * Template : Nouveau lead/contact
 */
function createNewLeadNotification(contact, property) {
  return {
    title: '🎯 Nouveau lead',
    body: `${contact.firstName} ${contact.lastName} s'intéresse à ${property?.address || 'un bien'}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `lead-${contact.id}`,
    data: {
      url: `/contacts/${contact.id}`,
      contactId: contact.id
    },
    requireInteraction: true
  };
}

module.exports = {
  VAPID_PUBLIC_KEY,
  savePushSubscription,
  removePushSubscription,
  sendPushNotificationToUser,
  sendPushNotificationToTeam,
  createAppointmentNotification,
  createPropertyMatchNotification,
  createAppointmentReminderNotification,
  createNewLeadNotification
};
