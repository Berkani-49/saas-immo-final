const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const stripeService = require('../services/stripeService');

/**
 * GET /api/billing/subscription
 * Récupérer l'abonnement actuel de l'utilisateur
 */
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        status: 'inactive',
      });
    }

    res.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.planName,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialEnd: subscription.trialEnd,
      },
    });
  } catch (error) {
    logger.error('Error fetching subscription', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement' });
  }
});

/**
 * POST /api/billing/create-checkout-session
 * Créer une session de paiement Stripe
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const userId = req.user.id;
    const { priceId, planName } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId est requis' });
    }

    // URLs de succès et d'annulation
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/dashboard?subscription=success`;
    const cancelUrl = `${baseUrl}/pricing?subscription=canceled`;

    // Créer la session de checkout
    const session = await stripeService.createCheckoutSession(
      req.user,
      priceId,
      successUrl,
      cancelUrl
    );

    res.json({ url: session.url });
  } catch (error) {
    logger.error('Error creating checkout session', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
  }
});

/**
 * POST /api/billing/cancel-subscription
 * Annuler l'abonnement à la fin de la période
 */
router.post('/cancel-subscription', async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    if (subscription.status === 'canceled') {
      return res.status(400).json({ error: 'L\'abonnement est déjà annulé' });
    }

    // Annuler l'abonnement sur Stripe
    const stripeSubscription = await stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    // Mettre à jour dans la base de données
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    logger.info('Subscription canceled', { userId, subscriptionId: subscription.id });

    res.json({
      message: 'Abonnement annulé avec succès. Vous conserverez l\'accès jusqu\'à la fin de la période.',
      subscription: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    logger.error('Error canceling subscription', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
  }
});

/**
 * POST /api/billing/reactivate-subscription
 * Réactiver un abonnement annulé
 */
router.post('/reactivate-subscription', async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'L\'abonnement n\'est pas en cours d\'annulation' });
    }

    // Réactiver l'abonnement sur Stripe
    await stripeService.reactivateSubscription(subscription.stripeSubscriptionId);

    // Mettre à jour dans la base de données
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
      },
    });

    logger.info('Subscription reactivated', { userId, subscriptionId: subscription.id });

    res.json({
      message: 'Abonnement réactivé avec succès',
      subscription: {
        cancelAtPeriodEnd: false,
      },
    });
  } catch (error) {
    logger.error('Error reactivating subscription', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la réactivation de l\'abonnement' });
  }
});

/**
 * POST /api/billing/create-portal-session
 * Créer une session du portail de facturation Stripe
 */
router.post('/create-portal-session', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'Aucun compte Stripe associé' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const returnUrl = `${baseUrl}/dashboard/billing`;

    const session = await stripeService.createBillingPortalSession(req.user, returnUrl);

    res.json({ url: session.url });
  } catch (error) {
    logger.error('Error creating portal session', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la création du portail de facturation' });
  }
});

/**
 * GET /api/billing/invoices
 * Récupérer l'historique des factures
 */
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.user.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    const invoices = await stripeService.listInvoices(req.user.stripeCustomerId, 20);

    // Formater les factures
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
      created: new Date(invoice.created * 1000),
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    }));

    res.json({ invoices: formattedInvoices });
  } catch (error) {
    logger.error('Error fetching invoices', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la récupération des factures' });
  }
});

/**
 * GET /api/billing/plans
 * Récupérer la liste des plans disponibles
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' },
    });

    res.json({ plans });
  } catch (error) {
    logger.error('Error fetching plans', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des plans' });
  }
});

module.exports = router;
