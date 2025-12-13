// Routes API pour le système de notifications automatiques

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
  sendNotification,
  sendEmail,
  getNewPropertyMatchEmail,
  getAppointmentReminderEmail,
  getNewLeadEmail
} = require('../services/notificationService');

// ========================================
// 🔔 ALERTE AUTOMATIQUE : Nouveau bien match
// ========================================

/**
 * Déclenché automatiquement quand un bien est créé
 * Recherche tous les acheteurs qui correspondent aux critères
 * et leur envoie une alerte
 */
async function notifyMatchingBuyers(property, agentId) {
  try {
    console.log(`🔍 Recherche d'acheteurs pour le bien #${property.id}...`);

    // 1. Trouver tous les acheteurs (BUYER) de cet agent
    const buyers = await prisma.contact.findMany({
      where: {
        agentId,
        type: 'BUYER',
        // Au moins un des canaux de notification activé
        OR: [
          { notifyByEmail: true },
          { notifyBySMS: true },
          { notifyByPush: true }
        ]
      }
    });

    console.log(`📋 ${buyers.length} acheteur(s) trouvé(s) pour cet agent`);

    const matches = [];

    // 2. Pour chaque acheteur, calculer le score de compatibilité
    for (const buyer of buyers) {
      let score = 0;
      const reasons = [];

      // Budget (40%)
      if (buyer.budgetMin && buyer.budgetMax) {
        if (property.price >= buyer.budgetMin && property.price <= buyer.budgetMax) {
          score += 40;
          reasons.push(`✅ Prix dans le budget (${buyer.budgetMin.toLocaleString()} - ${buyer.budgetMax.toLocaleString()} €)`);
        } else {
          const diff = property.price < buyer.budgetMin
            ? ((buyer.budgetMin - property.price) / buyer.budgetMin * 100).toFixed(0)
            : ((property.price - buyer.budgetMax) / buyer.budgetMax * 100).toFixed(0);
          reasons.push(`❌ Prix hors budget (écart: ${diff}%)`);
        }
      }

      // Ville (30%)
      if (buyer.cityPreferences) {
        const preferredCities = buyer.cityPreferences.split(',').map(c => c.trim().toLowerCase());
        if (property.city && preferredCities.includes(property.city.toLowerCase())) {
          score += 30;
          reasons.push(`✅ Ville correspondante (${property.city})`);
        } else {
          reasons.push(`⚠️ Ville différente des préférences`);
        }
      }

      // Chambres (15%)
      if (buyer.minBedrooms) {
        if (property.bedrooms >= buyer.minBedrooms) {
          score += 15;
          reasons.push(`✅ Nombre de chambres suffisant (${property.bedrooms} ≥ ${buyer.minBedrooms})`);
        } else {
          reasons.push(`❌ Pas assez de chambres (${property.bedrooms} < ${buyer.minBedrooms})`);
        }
      }

      // Surface (15%)
      if (buyer.minArea) {
        if (property.area >= buyer.minArea) {
          score += 15;
          reasons.push(`✅ Surface suffisante (${property.area} m² ≥ ${buyer.minArea} m²)`);
        } else {
          reasons.push(`❌ Surface trop petite (${property.area} m² < ${buyer.minArea} m²)`);
        }
      }

      // Si le score est >= 50%, on considère que c'est un bon match
      if (score >= 50) {
        matches.push({ buyer, score, reasons });
      }
    }

    console.log(`🎯 ${matches.length} match(s) trouvé(s) avec score >= 50%`);

    // 3. Envoyer une notification à chaque acheteur correspondant
    for (const { buyer, score, reasons } of matches) {
      const { subject, body, htmlBody } = getNewPropertyMatchEmail({
        contact: buyer,
        property,
        matchScore: score
      });

      await sendNotification({
        contactId: buyer.id,
        type: 'NEW_PROPERTY_MATCH',
        subject,
        body,
        htmlBody,
        metadata: {
          propertyId: property.id,
          matchScore: score,
          reasons
        }
      });

      console.log(`✅ Notification envoyée à ${buyer.firstName} ${buyer.lastName} (score: ${score}%)`);
    }

    return { success: true, matchesCount: matches.length };

  } catch (error) {
    console.error('❌ Erreur notifyMatchingBuyers:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// 🔔 ALERTE AUTOMATIQUE : Rappel de RDV
// ========================================

/**
 * À exécuter quotidiennement (CRON job)
 * Envoie un rappel email/SMS pour tous les RDV dans les 24h
 */
router.get('/send-appointment-reminders', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Trouver tous les RDV prévus demain
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        },
        status: 'PENDING'
      },
      include: {
        agent: true
      }
    });

    console.log(`📅 ${appointments.length} RDV prévu(s) demain`);

    const results = [];

    for (const appointment of appointments) {
      const { subject, body, htmlBody } = getAppointmentReminderEmail({
        appointment,
        agentName: `${appointment.agent.firstName} ${appointment.agent.lastName}`
      });

      // Envoyer uniquement par email (pas de contactId car lead pas encore créé)
      const result = await sendEmail({
        to: appointment.clientEmail,
        subject,
        html: htmlBody,
        text: body
      });

      // Enregistrer dans l'historique
      await prisma.notification.create({
        data: {
          type: 'APPOINTMENT_REMINDER',
          channel: 'EMAIL',
          recipient: appointment.clientEmail,
          subject,
          body,
          status: result.success ? 'SENT' : 'FAILED',
          metadata: JSON.stringify({ appointmentId: appointment.id })
        }
      });

      results.push({ appointmentId: appointment.id, ...result });
      console.log(`✅ Rappel envoyé pour RDV #${appointment.id}`);
    }

    res.json({
      success: true,
      appointmentsCount: appointments.length,
      results
    });

  } catch (error) {
    console.error('❌ Erreur send-appointment-reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 🔔 ALERTE AUTOMATIQUE : Nouveau lead
// ========================================

/**
 * Déclenché quand un nouveau contact est créé via le formulaire public
 * Envoie une notification à l'agent
 */
async function notifyAgentOfNewLead(contact, property) {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: contact.agentId }
    });

    if (!agent || !agent.email) {
      console.warn(`⚠️ Agent #${contact.agentId} n'a pas d'email`);
      return { success: false, error: 'Agent email manquant' };
    }

    const { subject, body, htmlBody } = getNewLeadEmail({
      agent,
      contact,
      property
    });

    const result = await sendEmail({
      to: agent.email,
      subject,
      html: htmlBody,
      text: body
    });

    // Enregistrer dans l'historique
    await prisma.notification.create({
      data: {
        type: 'NEW_LEAD',
        channel: 'EMAIL',
        recipient: agent.email,
        subject,
        body,
        status: result.success ? 'SENT' : 'FAILED',
        metadata: JSON.stringify({
          contactId: contact.id,
          propertyId: property.id
        })
      }
    });

    console.log(`✅ Agent ${agent.firstName} notifié du nouveau lead #${contact.id}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur notifyAgentOfNewLead:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// 📊 ROUTES API - Gestion des préférences
// ========================================

/**
 * Mettre à jour les préférences de notification d'un contact
 * PUT /api/contacts/:id/notification-preferences
 */
router.put('/contacts/:id/preferences', async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { notifyByEmail, notifyBySMS, notifyByPush, fcmToken } = req.body;

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        notifyByEmail,
        notifyBySMS,
        notifyByPush,
        fcmToken
      }
    });

    console.log(`✅ Préférences mises à jour pour contact #${contactId}`);
    res.json({ success: true, contact });

  } catch (error) {
    console.error('❌ Erreur mise à jour préférences:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir l'historique des notifications d'un contact
 * GET /api/contacts/:id/notifications
 */
router.get('/contacts/:id/notifications', async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);

    const notifications = await prisma.notification.findMany({
      where: { contactId },
      orderBy: { sentAt: 'desc' },
      take: 50 // Limiter aux 50 dernières
    });

    res.json({ success: true, notifications });

  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * TEST : Envoyer une notification de test
 * POST /api/notifications/test
 */
router.post('/test', async (req, res) => {
  try {
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId requis' });
    }

    const result = await sendNotification({
      contactId,
      type: 'TEST',
      subject: 'Test de notification',
      body: 'Ceci est un test du système de notifications ImmoPro.',
      htmlBody: '<h2>Test de notification</h2><p>Ceci est un test du système de notifications ImmoPro.</p>',
      metadata: { test: true }
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur test notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXPORTS
// ========================================

module.exports = {
  router,
  notifyMatchingBuyers, // Appelé après création d'un bien
  notifyAgentOfNewLead  // Appelé après création d'un lead public
};
