// Service centralisé pour toutes les notifications (Email, SMS, Push)

const { Resend } = require('resend');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========================================
// CONFIGURATION DES SERVICES
// ========================================

// 📧 RESEND (Email)
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'ImmoPro <onboarding@resend.dev>'; // Remplacez par votre domaine vérifié

// 📱 TWILIO (SMS) - À configurer
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// 🔔 FIREBASE (Push Notifications) - À configurer
let firebaseAdmin = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// ========================================
// FONCTIONS D'ENVOI
// ========================================

/**
 * Envoyer un email
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text
    });

    if (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error };
    }

    console.log(`✅ Email envoyé à ${to}`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer un SMS
 */
async function sendSMS({ to, body }) {
  if (!twilioClient) {
    console.warn('⚠️ Twilio non configuré, impossible d\'envoyer un SMS');
    return { success: false, error: 'Twilio non configuré' };
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      to, // Format: +33612345678
      from: process.env.TWILIO_PHONE_NUMBER
    });

    console.log(`✅ SMS envoyé à ${to} (SID: ${message.sid})`);
    return { success: true, data: message };
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer une notification push
 */
async function sendPushNotification({ fcmToken, title, body, data = {} }) {
  if (!firebaseAdmin) {
    console.warn('⚠️ Firebase non configuré, impossible d\'envoyer une push notification');
    return { success: false, error: 'Firebase non configuré' };
  }

  try {
    const message = {
      notification: { title, body },
      data,
      token: fcmToken
    };

    const response = await firebaseAdmin.messaging().send(message);
    console.log(`✅ Push notification envoyée (Message ID: ${response})`);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Erreur envoi push notification:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// FONCTION PRINCIPALE : Envoyer une notification
// ========================================

/**
 * Envoie une notification multi-canal (Email + SMS + Push)
 * et enregistre l'historique dans la BDD
 */
async function sendNotification({
  contactId,
  type, // "NEW_PROPERTY_MATCH", "APPOINTMENT_REMINDER", "NEW_LEAD"
  subject,
  body,
  htmlBody,
  metadata = {}
}) {
  try {
    // 1. Récupérer les préférences du contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        email: true,
        phoneNumber: true,
        notifyByEmail: true,
        notifyBySMS: true,
        notifyByPush: true,
        fcmToken: true
      }
    });

    if (!contact) {
      console.error(`❌ Contact ${contactId} introuvable`);
      return { success: false, error: 'Contact introuvable' };
    }

    const results = [];

    // 2. Envoyer par EMAIL si activé
    if (contact.notifyByEmail && contact.email) {
      const emailResult = await sendEmail({
        to: contact.email,
        subject,
        html: htmlBody || body,
        text: body
      });

      // Enregistrer dans l'historique
      await prisma.notification.create({
        data: {
          type,
          channel: 'EMAIL',
          recipient: contact.email,
          subject,
          body,
          status: emailResult.success ? 'SENT' : 'FAILED',
          metadata: JSON.stringify(metadata),
          contactId
        }
      });

      results.push({ channel: 'EMAIL', ...emailResult });
    }

    // 3. Envoyer par SMS si activé
    if (contact.notifyBySMS && contact.phoneNumber && twilioClient) {
      const smsResult = await sendSMS({
        to: contact.phoneNumber,
        body
      });

      await prisma.notification.create({
        data: {
          type,
          channel: 'SMS',
          recipient: contact.phoneNumber,
          subject: null,
          body,
          status: smsResult.success ? 'SENT' : 'FAILED',
          metadata: JSON.stringify(metadata),
          contactId
        }
      });

      results.push({ channel: 'SMS', ...smsResult });
    }

    // 4. Envoyer PUSH NOTIFICATION si activé
    if (contact.notifyByPush && contact.fcmToken && firebaseAdmin) {
      const pushResult = await sendPushNotification({
        fcmToken: contact.fcmToken,
        title: subject,
        body,
        data: metadata
      });

      await prisma.notification.create({
        data: {
          type,
          channel: 'PUSH',
          recipient: contact.fcmToken,
          subject,
          body,
          status: pushResult.success ? 'SENT' : 'FAILED',
          metadata: JSON.stringify(metadata),
          contactId
        }
      });

      results.push({ channel: 'PUSH', ...pushResult });
    }

    console.log(`📬 Notification envoyée au contact #${contactId}:`, results);
    return { success: true, results };

  } catch (error) {
    console.error('❌ Erreur sendNotification:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// TEMPLATES D'EMAILS
// ========================================

/**
 * Template : Nouveau bien correspond aux critères d'un acheteur
 */
function getNewPropertyMatchEmail({ contact, property, matchScore }) {
  const subject = `🏠 Nouveau bien à ${property.city} - ${property.price.toLocaleString()} €`;

  const body = `Bonjour ${contact.firstName},\n\nUn nouveau bien correspond à vos critères de recherche (compatibilité: ${matchScore}%) :\n\n📍 ${property.address}, ${property.city}\n💰 ${property.price.toLocaleString()} €\n📐 ${property.area} m²\n🛏️ ${property.bedrooms} chambre(s)\n\nConsultez la fiche complète : ${process.env.FRONTEND_URL}/share/${property.id}\n\nÀ bientôt,\nVotre agent immobilier`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D3748;">🏠 Nouveau bien disponible !</h2>
      <p>Bonjour <strong>${contact.firstName}</strong>,</p>
      <p>Un nouveau bien correspond à vos critères de recherche avec une <span style="background: #48BB78; color: white; padding: 2px 8px; border-radius: 4px;">compatibilité de ${matchScore}%</span> :</p>

      <div style="border: 2px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        ${property.imageUrl ? `<img src="${property.imageUrl}" alt="Photo du bien" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">` : ''}
        <h3 style="color: #2B6CB0; margin: 0 0 10px 0;">${property.address}</h3>
        <p style="color: #718096; margin: 5px 0;">📍 ${property.city}</p>
        <p style="font-size: 24px; color: #48BB78; font-weight: bold; margin: 10px 0;">${property.price.toLocaleString()} €</p>
        <div style="display: flex; gap: 15px; margin-top: 10px;">
          <span>📐 ${property.area} m²</span>
          <span>🛏️ ${property.bedrooms} ch.</span>
          <span>🚪 ${property.rooms} pièces</span>
        </div>
      </div>

      ${property.description ? `<p style="color: #4A5568;">${property.description}</p>` : ''}

      <a href="${process.env.FRONTEND_URL}/share/${property.id}" style="display: inline-block; background: #4299E1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Voir la fiche complète</a>

      <p style="color: #A0AEC0; font-size: 12px; margin-top: 30px;">Vous recevez cet email car vous avez demandé à être alerté(e) des nouveaux biens correspondant à vos critères.</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

/**
 * Template : Rappel de rendez-vous
 */
function getAppointmentReminderEmail({ appointment, agentName }) {
  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = appointmentDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = `📅 Rappel : Rendez-vous demain à ${formattedTime}`;

  const body = `Bonjour ${appointment.clientName},\n\nCe message pour vous rappeler votre rendez-vous prévu demain :\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n👤 Avec ${agentName}\n\nÀ très bientôt !`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D3748;">📅 Rappel de rendez-vous</h2>
      <p>Bonjour <strong>${appointment.clientName}</strong>,</p>
      <p>Ce message pour vous rappeler votre rendez-vous prévu <strong>demain</strong> :</p>

      <div style="background: #EDF2F7; border-left: 4px solid #4299E1; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>⏰ Heure :</strong> ${formattedTime}</p>
        <p style="margin: 5px 0;"><strong>👤 Avec :</strong> ${agentName}</p>
        ${appointment.notes ? `<p style="margin: 5px 0;"><strong>📝 Notes :</strong> ${appointment.notes}</p>` : ''}
      </div>

      <p>À très bientôt !</p>
      <p style="color: #A0AEC0; font-size: 12px; margin-top: 30px;">Si vous souhaitez annuler ou modifier votre rendez-vous, contactez-nous directement.</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

/**
 * Template : Nouveau lead pour l'agent
 */
function getNewLeadEmail({ agent, contact, property }) {
  const subject = `🎯 Nouveau lead : ${contact.firstName} ${contact.lastName}`;

  const body = `Bonjour ${agent.firstName},\n\nVous avez reçu un nouveau contact intéressé par le bien "${property.address}" :\n\n👤 ${contact.firstName} ${contact.lastName}\n📧 ${contact.email}\n📱 ${contact.phoneNumber || 'Non renseigné'}\n\nConsultez votre tableau de bord pour le contacter.`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D3748;">🎯 Nouveau lead reçu !</h2>
      <p>Bonjour <strong>${agent.firstName}</strong>,</p>
      <p>Vous avez reçu un nouveau contact intéressé par le bien <strong>"${property.address}"</strong> :</p>

      <div style="background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>👤 Nom :</strong> ${contact.firstName} ${contact.lastName}</p>
        <p style="margin: 5px 0;"><strong>📧 Email :</strong> ${contact.email}</p>
        <p style="margin: 5px 0;"><strong>📱 Téléphone :</strong> ${contact.phoneNumber || 'Non renseigné'}</p>
      </div>

      <a href="${process.env.FRONTEND_URL}/contacts" style="display: inline-block; background: #48BB78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Voir le contact</a>

      <p style="color: #A0AEC0; font-size: 12px; margin-top: 30px;">Réagissez vite pour maximiser vos chances de conversion !</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  sendNotification,
  sendEmail,
  sendSMS,
  sendPushNotification,
  getNewPropertyMatchEmail,
  getAppointmentReminderEmail,
  getNewLeadEmail
};
