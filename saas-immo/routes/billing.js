const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const stripeService = require('../services/stripeService');
const notificationService = require('../services/subscriptionNotificationService');

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
    const { priceId, planName, trialDays, coupon } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId est requis' });
    }

    // URLs de succès et d'annulation
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/dashboard?subscription=success`;
    const cancelUrl = `${baseUrl}/pricing?subscription=canceled`;

    // Options pour la session de checkout
    const options = {};

    // Ajouter la période d'essai si demandée (par défaut 14 jours)
    if (trialDays !== undefined) {
      options.trialDays = parseInt(trialDays);
    } else if (process.env.STRIPE_TRIAL_DAYS) {
      options.trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS);
    }

    // Ajouter le coupon si fourni
    if (coupon) {
      options.coupon = coupon;
    }

    // Créer la session de checkout
    const session = await stripeService.createCheckoutSession(
      req.user,
      priceId,
      successUrl,
      cancelUrl,
      options
    );

    res.json({ url: session.url, hasTrialPeriod: !!options.trialDays });
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

/**
 * POST /api/billing/change-plan
 * Changer de plan (upgrade ou downgrade)
 */
router.post('/change-plan', async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPriceId, newPlanName } = req.body;

    if (!newPriceId || !newPlanName) {
      return res.status(400).json({ error: 'newPriceId et newPlanName sont requis' });
    }

    // Récupérer l'abonnement actuel
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ error: 'L\'abonnement doit être actif pour changer de plan' });
    }

    // Récupérer l'abonnement Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Mettre à jour l'abonnement sur Stripe avec proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Créer une proration automatique
    });

    // Mettre à jour dans la base de données
    const price = updatedSubscription.items.data[0].price;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: newPriceId,
        planName: newPlanName,
        amount: price.unit_amount,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      },
    });

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: newPlanName,
      },
    });

    logger.info('Plan changed successfully', { userId, oldPlan: subscription.planName, newPlan: newPlanName });

    // Envoyer l'email de notification de changement de plan
    const updatedSubscriptionData = await prisma.subscription.findUnique({ where: { userId } });
    if (updatedSubscriptionData) {
      await notificationService.sendPlanChangedEmail(req.user, subscription.planName, newPlanName, updatedSubscriptionData);
    }

    res.json({
      message: 'Plan changé avec succès',
      subscription: {
        planName: newPlanName,
        amount: price.unit_amount,
      },
    });
  } catch (error) {
    logger.error('Error changing plan', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors du changement de plan' });
  }
});

/**
 * POST /api/billing/apply-coupon
 * Appliquer un code promo
 */
router.post('/apply-coupon', async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ error: 'Code promo requis' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    // Appliquer le coupon sur Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    try {
      const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        coupon: couponCode,
      });

      logger.info('Coupon applied', { userId, couponCode });

      res.json({
        message: 'Code promo appliqué avec succès',
        discount: updatedSubscription.discount,
      });
    } catch (stripeError) {
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({ error: 'Code promo invalide ou expiré' });
      }
      throw stripeError;
    }
  } catch (error) {
    logger.error('Error applying coupon', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de l\'application du code promo' });
  }
});

/**
 * GET /api/billing/usage
 * Récupérer l'utilisation actuelle (limites du plan)
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le plan actuel
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        usage: {
          properties: 0,
          contacts: 0,
          employees: 0,
        },
        limits: {
          properties: 0,
          contacts: 0,
          employees: 0,
        },
      });
    }

    // Récupérer le plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: subscription.stripePriceId },
    });

    // Compter l'utilisation actuelle
    const [propertiesCount, contactsCount, employeesCount] = await Promise.all([
      prisma.property.count({ where: { agentId: userId } }),
      prisma.contact.count({ where: { agentId: userId } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }), // À adapter selon votre logique
    ]);

    res.json({
      hasSubscription: true,
      planName: subscription.planName,
      usage: {
        properties: propertiesCount,
        contacts: contactsCount,
        employees: employeesCount,
      },
      limits: {
        properties: plan?.maxProperties || null,
        contacts: plan?.maxContacts || null,
        employees: plan?.maxEmployees || null,
      },
      isLimitReached: {
        properties: plan?.maxProperties ? propertiesCount >= plan.maxProperties : false,
        contacts: plan?.maxContacts ? contactsCount >= plan.maxContacts : false,
        employees: plan?.maxEmployees ? employeesCount >= plan.maxEmployees : false,
      },
    });
  } catch (error) {
    logger.error('Error fetching usage', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisation' });
  }
});

/**
 * POST /api/billing/retry-payment
 * Réessayer un paiement échoué
 */
router.post('/retry-payment', async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    if (subscription.status !== 'past_due') {
      return res.status(400).json({ error: 'L\'abonnement n\'a pas de paiement en attente' });
    }

    // Récupérer la dernière facture non payée
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      status: 'open',
      limit: 1,
    });

    if (invoices.data.length === 0) {
      return res.status(404).json({ error: 'Aucune facture impayée trouvée' });
    }

    const invoice = invoices.data[0];

    // Réessayer le paiement
    try {
      const paidInvoice = await stripe.invoices.pay(invoice.id);

      if (paidInvoice.status === 'paid') {
        // Mettre à jour le statut de l'abonnement
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'active' },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: 'active' },
        });

        logger.info('Payment retried successfully', { userId, invoiceId: invoice.id });

        res.json({
          message: 'Paiement réussi',
          status: 'active',
        });
      } else {
        res.json({
          message: 'Le paiement n\'a pas pu être traité',
          status: paidInvoice.status,
        });
      }
    } catch (paymentError) {
      logger.error('Payment retry failed', { error: paymentError.message, userId });
      res.status(400).json({
        error: 'Le paiement a échoué',
        message: paymentError.message,
      });
    }
  } catch (error) {
    logger.error('Error retrying payment', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la tentative de paiement' });
  }
});

module.exports = router;
