const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const notificationService = require('../services/subscriptionNotificationService');

// Webhook endpoint - DOIT être avant express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Vérifier la signature du webhook
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // En développement, on peut accepter sans vérification
      event = JSON.parse(req.body.toString());
      logger.warn('Webhook signature not verified (no STRIPE_WEBHOOK_SECRET)');
    }
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log l'événement reçu
  logger.info('Stripe webhook received', { type: event.type, id: event.id });

  // Sauvegarder l'événement dans la base de données
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        data: event.data,
        processed: false,
      },
    });
  } catch (error) {
    if (error.code !== 'P2002') { // Ignorer les doublons
      logger.error('Error saving webhook event', { error: error.message });
    }
  }

  // Traiter l'événement
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    // Marquer l'événement comme traité
    await prisma.stripeWebhookEvent.updateMany({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', { type: event.type, error: error.message });

    // Marquer l'événement comme échoué
    await prisma.stripeWebhookEvent.updateMany({
      where: { stripeEventId: event.id },
      data: {
        processed: false,
        error: error.message,
      },
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Gérer la complétion d'une session de checkout
 */
async function handleCheckoutSessionCompleted(session) {
  logger.info('Processing checkout session completed', { sessionId: session.id });

  const userId = parseInt(session.metadata.userId);
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId || !subscriptionId) {
    logger.error('Missing userId or subscriptionId in session metadata');
    return;
  }

  // Récupérer les détails de l'abonnement
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Récupérer le prix pour obtenir le plan
  const priceId = subscription.items.data[0].price.id;
  const price = subscription.items.data[0].price;

  // Déterminer le nom du plan (vous pouvez personnaliser ceci)
  let planName = 'starter';
  if (price.unit_amount >= 9900) planName = 'premium';
  else if (price.unit_amount >= 4900) planName = 'pro';

  // Créer ou mettre à jour l'abonnement dans la base de données
  await prisma.subscription.upsert({
    where: { userId: userId },
    create: {
      userId: userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCustomerId: customerId,
      status: subscription.status,
      planName: planName,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring.interval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
    update: {
      status: subscription.status,
      planName: planName,
      amount: price.unit_amount,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Mettre à jour le statut de l'utilisateur
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      subscriptionStatus: subscription.status,
      subscriptionPlan: planName,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    },
  });

  logger.info('Subscription created from checkout', { userId, subscriptionId });

  // Envoyer l'email de bienvenue
  const subscriptionData = await prisma.subscription.findUnique({ where: { userId } });
  if (subscriptionData) {
    await notificationService.sendSubscriptionWelcomeEmail(user, subscriptionData);
  }
}

/**
 * Gérer la création d'un abonnement
 */
async function handleSubscriptionCreated(subscription) {
  logger.info('Processing subscription created', { subscriptionId: subscription.id });

  const userId = parseInt(subscription.metadata.userId);
  if (!userId) {
    logger.error('Missing userId in subscription metadata');
    return;
  }

  const price = subscription.items.data[0].price;
  const priceId = price.id;

  let planName = 'starter';
  if (price.unit_amount >= 9900) planName = 'premium';
  else if (price.unit_amount >= 4900) planName = 'pro';

  await prisma.subscription.upsert({
    where: { userId: userId },
    create: {
      userId: userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCustomerId: subscription.customer,
      status: subscription.status,
      planName: planName,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring.interval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

/**
 * Gérer la mise à jour d'un abonnement
 */
async function handleSubscriptionUpdated(subscription) {
  logger.info('Processing subscription updated', { subscriptionId: subscription.id });

  const userId = parseInt(subscription.metadata.userId);
  if (!userId) {
    // Essayer de trouver l'utilisateur via le stripeCustomerId
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer },
    });

    if (!user) {
      logger.error('Cannot find user for subscription');
      return;
    }
  }

  const price = subscription.items.data[0].price;

  let planName = 'starter';
  if (price.unit_amount >= 9900) planName = 'premium';
  else if (price.unit_amount >= 4900) planName = 'pro';

  // Mettre à jour l'abonnement
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      planName: planName,
      amount: price.unit_amount,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  // Mettre à jour l'utilisateur
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (sub) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionPlan: planName,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  logger.info('Subscription updated', { subscriptionId: subscription.id });
}

/**
 * Gérer la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription) {
  logger.info('Processing subscription deleted', { subscriptionId: subscription.id });

  // Mettre à jour le statut de l'abonnement
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // Mettre à jour l'utilisateur
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (sub) {
    const user = await prisma.user.update({
      where: { id: sub.userId },
      data: {
        subscriptionStatus: 'inactive',
        subscriptionPlan: null,
      },
    });

    // Envoyer l'email de confirmation d'annulation
    await notificationService.sendSubscriptionCanceledEmail(user, sub);
  }

  logger.info('Subscription deleted', { subscriptionId: subscription.id });
}

/**
 * Gérer le succès d'un paiement
 */
async function handleInvoicePaymentSucceeded(invoice) {
  logger.info('Invoice payment succeeded', { invoiceId: invoice.id });

  // Si c'est le premier paiement, l'abonnement est déjà créé par checkout.session.completed
  // Pour les renouvellements, envoyer un email
  if (invoice.billing_reason === 'subscription_cycle') {
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: invoice.customer },
    });

    if (user) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      if (subscription) {
        await notificationService.sendSubscriptionRenewalEmail(user, subscription, invoice);
      }
    }
  }
}

/**
 * Gérer l'échec d'un paiement
 */
async function handleInvoicePaymentFailed(invoice) {
  logger.error('Invoice payment failed', { invoiceId: invoice.id, customerId: invoice.customer });

  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer },
  });

  if (user) {
    // Mettre à jour le statut
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });

    // Envoyer un email à l'utilisateur
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (subscription) {
      await notificationService.sendPaymentFailedEmail(user, subscription, invoice);
    }

    logger.warn('User subscription is past due', { userId: user.id, email: user.email });
  }
}

module.exports = router;
