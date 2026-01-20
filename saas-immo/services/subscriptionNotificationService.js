const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Service pour envoyer les notifications par email pour les événements d'abonnement
 */

/**
 * Envoyer un email de bienvenue après souscription
 */
async function sendSubscriptionWelcomeEmail(user, subscription) {
  try {
    const planDetails = {
      starter: { name: 'Starter', features: '10 propriétés, 50 contacts' },
      pro: { name: 'Pro', features: '50 propriétés, 200 contacts, IA avancée' },
      premium: { name: 'Premium', features: 'Propriétés illimitées, contacts illimités, support prioritaire' }
    };

    const plan = planDetails[subscription.planName] || { name: subscription.planName, features: 'Toutes les fonctionnalités' };

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
      to: user.email,
      subject: `🎉 Bienvenue dans ImmoPro ${plan.name} !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bienvenue dans ImmoPro ${plan.name} !</h1>

          <p>Bonjour ${user.firstName},</p>

          <p>Merci d'avoir souscrit à <strong>ImmoPro ${plan.name}</strong> ! Votre abonnement est maintenant actif.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Votre plan inclut :</h2>
            <p style="font-size: 16px; margin: 0;">${plan.features}</p>
          </div>

          <p>Montant : <strong>${(subscription.amount / 100).toFixed(2)} ${subscription.currency.toUpperCase()}</strong> / ${subscription.interval === 'month' ? 'mois' : 'an'}</p>

          <p>Prochaine facturation : <strong>${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}</strong></p>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder au dashboard
            </a>
          </div>

          <p>Vous pouvez gérer votre abonnement à tout moment depuis votre dashboard.</p>

          <p>Besoin d'aide ? Contactez-nous à support@immopro.com</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            ImmoPro - Votre plateforme de gestion immobilière
          </p>
        </div>
      `,
    });

    logger.info('Subscription welcome email sent', { userId: user.id, email: user.email, emailId: data.id });
    return data;
  } catch (error) {
    logger.error('Error sending subscription welcome email', { error: error.message, userId: user.id });
    // Ne pas faire échouer l'opération si l'email échoue
    return null;
  }
}

/**
 * Envoyer un email de renouvellement réussi
 */
async function sendSubscriptionRenewalEmail(user, subscription, invoice) {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
      to: user.email,
      subject: '✅ Renouvellement de votre abonnement ImmoPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Renouvellement réussi !</h1>

          <p>Bonjour ${user.firstName},</p>

          <p>Votre abonnement <strong>ImmoPro ${subscription.planName}</strong> a été renouvelé avec succès.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Montant facturé :</strong> ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Date de facturation :</strong> ${new Date(invoice.created * 1000).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;"><strong>Prochaine facturation :</strong> ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}</p>
          </div>

          ${invoice.hosted_invoice_url ? `
          <div style="margin: 30px 0;">
            <a href="${invoice.hosted_invoice_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir la facture
            </a>
          </div>
          ` : ''}

          <p>Merci de votre confiance !</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            ImmoPro - Votre plateforme de gestion immobilière
          </p>
        </div>
      `,
    });

    logger.info('Subscription renewal email sent', { userId: user.id, email: user.email, emailId: data.id });
    return data;
  } catch (error) {
    logger.error('Error sending subscription renewal email', { error: error.message, userId: user.id });
    return null;
  }
}

/**
 * Envoyer un email d'échec de paiement
 */
async function sendPaymentFailedEmail(user, subscription, invoice) {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
      to: user.email,
      subject: '⚠️ Échec du paiement de votre abonnement ImmoPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Échec du paiement</h1>

          <p>Bonjour ${user.firstName},</p>

          <p>Nous n'avons pas pu traiter le paiement pour votre abonnement <strong>ImmoPro ${subscription.planName}</strong>.</p>

          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Montant :</strong> ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Date de tentative :</strong> ${new Date(invoice.created * 1000).toLocaleDateString('fr-FR')}</p>
          </div>

          <p><strong>Action requise :</strong> Veuillez mettre à jour votre moyen de paiement pour éviter l'interruption de votre service.</p>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/billing" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Mettre à jour le paiement
            </a>
          </div>

          <p>Si vous ne mettez pas à jour votre moyen de paiement, votre abonnement sera suspendu.</p>

          <p>Besoin d'aide ? Contactez-nous à support@immopro.com</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            ImmoPro - Votre plateforme de gestion immobilière
          </p>
        </div>
      `,
    });

    logger.info('Payment failed email sent', { userId: user.id, email: user.email, emailId: data.id });
    return data;
  } catch (error) {
    logger.error('Error sending payment failed email', { error: error.message, userId: user.id });
    return null;
  }
}

/**
 * Envoyer un email de confirmation d'annulation
 */
async function sendSubscriptionCanceledEmail(user, subscription) {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
      to: user.email,
      subject: 'Confirmation d\'annulation de votre abonnement ImmoPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6b7280;">Annulation confirmée</h1>

          <p>Bonjour ${user.firstName},</p>

          <p>Nous confirmons l'annulation de votre abonnement <strong>ImmoPro ${subscription.planName}</strong>.</p>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important :</strong> Vous conserverez l'accès à toutes les fonctionnalités jusqu'au <strong>${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}</strong>.</p>
          </div>

          <p>Après cette date, votre compte passera en mode gratuit avec des fonctionnalités limitées.</p>

          <p>Vous avez changé d'avis ? Vous pouvez réactiver votre abonnement à tout moment.</p>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/pricing" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Réactiver l'abonnement
            </a>
          </div>

          <p>Nous sommes désolés de vous voir partir. Si vous avez des commentaires à partager, n'hésitez pas à nous contacter.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            ImmoPro - Votre plateforme de gestion immobilière
          </p>
        </div>
      `,
    });

    logger.info('Subscription canceled email sent', { userId: user.id, email: user.email, emailId: data.id });
    return data;
  } catch (error) {
    logger.error('Error sending subscription canceled email', { error: error.message, userId: user.id });
    return null;
  }
}

/**
 * Envoyer un email de changement de plan
 */
async function sendPlanChangedEmail(user, oldPlan, newPlan, subscription) {
  try {
    const isUpgrade = subscription.amount > 0; // Simplifié, vous pouvez améliorer cette logique

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
      to: user.email,
      subject: `${isUpgrade ? '⬆️ Upgrade' : '⬇️ Changement'} de votre plan ImmoPro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">${isUpgrade ? 'Upgrade réussi !' : 'Plan modifié'}</h1>

          <p>Bonjour ${user.firstName},</p>

          <p>Votre plan a été modifié avec succès :</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ancien plan :</strong> ${oldPlan}</p>
            <p style="margin: 5px 0;"><strong>Nouveau plan :</strong> ${newPlan}</p>
            <p style="margin: 5px 0;"><strong>Nouveau montant :</strong> ${(subscription.amount / 100).toFixed(2)} ${subscription.currency.toUpperCase()} / ${subscription.interval === 'month' ? 'mois' : 'an'}</p>
          </div>

          <p>La proration a été appliquée automatiquement. Le montant ajusté sera reflété sur votre prochaine facture.</p>

          <p>Prochaine facturation : <strong>${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}</strong></p>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder au dashboard
            </a>
          </div>

          <p>Merci de votre confiance !</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            ImmoPro - Votre plateforme de gestion immobilière
          </p>
        </div>
      `,
    });

    logger.info('Plan changed email sent', { userId: user.id, email: user.email, emailId: data.id });
    return data;
  } catch (error) {
    logger.error('Error sending plan changed email', { error: error.message, userId: user.id });
    return null;
  }
}

/**
 * Envoyer un email de fin de période d'essai
 */
async function sendTrialEndingEmail(user, subscription, daysLeft) {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
      to: user.email,
      subject: `⏰ Votre période d'essai se termine dans ${daysLeft} jours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">Période d'essai bientôt terminée</h1>

          <p>Bonjour ${user.firstName},</p>

          <p>Votre période d'essai gratuite de 14 jours pour <strong>ImmoPro ${subscription.planName}</strong> se termine dans <strong>${daysLeft} jours</strong>.</p>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Fin de l'essai :</strong> ${new Date(subscription.trialEnd).toLocaleDateString('fr-FR')}</p>
          </div>

          <p>Après cette date, votre carte sera automatiquement débitée de <strong>${(subscription.amount / 100).toFixed(2)} ${subscription.currency.toUpperCase()}</strong> pour continuer à profiter de toutes les fonctionnalités.</p>

          <p>Vous pouvez annuler à tout moment avant la fin de la période d'essai.</p>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/billing" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Gérer mon abonnement
            </a>
          </div>

          <p>Des questions ? Contactez-nous à support@immopro.com</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            ImmoPro - Votre plateforme de gestion immobilière
          </p>
        </div>
      `,
    });

    logger.info('Trial ending email sent', { userId: user.id, email: user.email, emailId: data.id });
    return data;
  } catch (error) {
    logger.error('Error sending trial ending email', { error: error.message, userId: user.id });
    return null;
  }
}

module.exports = {
  sendSubscriptionWelcomeEmail,
  sendSubscriptionRenewalEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
  sendPlanChangedEmail,
  sendTrialEndingEmail,
};
