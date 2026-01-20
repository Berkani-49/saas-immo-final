const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Routes admin pour gérer les abonnements
 * Base URL: /api/admin/subscriptions
 * Toutes les routes nécessitent le rôle ADMIN
 */

/**
 * GET /api/admin/subscriptions
 * Lister tous les abonnements avec filtres
 */
router.get('/', async (req, res) => {
  try {
    const { status, planName, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (planName) where.planName = planName;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching subscriptions (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements' });
  }
});

/**
 * GET /api/admin/subscriptions/stats
 * Statistiques globales des abonnements
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions,
      pastDueSubscriptions,
      mrr,
      subscriptionsByPlan,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'canceled' } }),
      prisma.subscription.count({ where: { status: 'past_due' } }),
      // MRR (Monthly Recurring Revenue) - somme des montants actifs
      prisma.subscription.aggregate({
        where: {
          status: { in: ['active', 'trialing'] },
          interval: 'month',
        },
        _sum: { amount: true },
      }),
      // Distribution par plan
      prisma.subscription.groupBy({
        by: ['planName'],
        _count: true,
        where: { status: { in: ['active', 'trialing'] } },
      }),
    ]);

    res.json({
      total: totalSubscriptions,
      active: activeSubscriptions,
      canceled: canceledSubscriptions,
      pastDue: pastDueSubscriptions,
      mrr: mrr._sum.amount || 0,
      byPlan: subscriptionsByPlan.map(p => ({
        plan: p.planName,
        count: p._count,
      })),
    });
  } catch (error) {
    logger.error('Error fetching subscription stats', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * GET /api/admin/subscriptions/:userId
 * Récupérer l'abonnement d'un utilisateur spécifique
 */
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Récupérer l'abonnement Stripe pour des infos supplémentaires
    let stripeSubscription = null;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    } catch (error) {
      logger.warn('Could not fetch Stripe subscription', { error: error.message });
    }

    res.json({
      subscription,
      stripeData: stripeSubscription,
    });
  } catch (error) {
    logger.error('Error fetching subscription (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement' });
  }
});

/**
 * POST /api/admin/subscriptions/:userId/cancel
 * Annuler l'abonnement d'un utilisateur (immédiatement ou en fin de période)
 */
router.post('/:userId/cancel', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { immediate = false } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    if (immediate) {
      // Annulation immédiate
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'inactive',
          subscriptionPlan: null,
        },
      });

      logger.info('Subscription canceled immediately by admin', { userId, adminId: req.user.id });

      res.json({ message: 'Abonnement annulé immédiatement' });
    } else {
      // Annulation en fin de période
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      });

      logger.info('Subscription set to cancel at period end by admin', { userId, adminId: req.user.id });

      res.json({
        message: 'Abonnement programmé pour annulation en fin de période',
        endsAt: subscription.currentPeriodEnd,
      });
    }
  } catch (error) {
    logger.error('Error canceling subscription (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
  }
});

/**
 * POST /api/admin/subscriptions/:userId/reactivate
 * Réactiver un abonnement annulé
 */
router.post('/:userId/reactivate', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    if (subscription.status === 'canceled') {
      return res.status(400).json({
        error: 'Impossible de réactiver un abonnement déjà annulé',
        message: 'L\'utilisateur doit créer un nouvel abonnement',
      });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: false },
    });

    logger.info('Subscription reactivated by admin', { userId, adminId: req.user.id });

    res.json({ message: 'Abonnement réactivé avec succès' });
  } catch (error) {
    logger.error('Error reactivating subscription (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la réactivation de l\'abonnement' });
  }
});

/**
 * POST /api/admin/subscriptions/:userId/extend
 * Prolonger la période d'abonnement (offrir des jours gratuits)
 */
router.post('/:userId/extend', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { days } = req.body;

    if (!days || days < 1) {
      return res.status(400).json({ error: 'Le nombre de jours doit être supérieur à 0' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Calculer la nouvelle date de fin
    const currentEnd = new Date(subscription.currentPeriodEnd);
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    // Mettre à jour sur Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      trial_end: Math.floor(newEnd.getTime() / 1000),
      proration_behavior: 'none',
    });

    // Mettre à jour en base de données
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { currentPeriodEnd: newEnd },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionEndDate: newEnd },
    });

    logger.info('Subscription extended by admin', { userId, days, adminId: req.user.id });

    res.json({
      message: `Abonnement prolongé de ${days} jours`,
      newEndDate: newEnd,
    });
  } catch (error) {
    logger.error('Error extending subscription (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la prolongation de l\'abonnement' });
  }
});

/**
 * POST /api/admin/subscriptions/:userId/update-plan
 * Changer le plan d'un utilisateur (admin override)
 */
router.post('/:userId/update-plan', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { newPriceId, newPlanName } = req.body;

    if (!newPriceId || !newPlanName) {
      return res.status(400).json({ error: 'newPriceId et newPlanName requis' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'none', // Admin change sans proration
    });

    const price = updatedSubscription.items.data[0].price;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: newPriceId,
        planName: newPlanName,
        amount: price.unit_amount,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionPlan: newPlanName },
    });

    logger.info('Plan updated by admin', { userId, oldPlan: subscription.planName, newPlan: newPlanName, adminId: req.user.id });

    res.json({
      message: 'Plan mis à jour avec succès',
      subscription: {
        planName: newPlanName,
        amount: price.unit_amount,
      },
    });
  } catch (error) {
    logger.error('Error updating plan (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la mise à jour du plan' });
  }
});

/**
 * GET /api/admin/subscriptions/:userId/invoices
 * Récupérer toutes les factures d'un utilisateur
 */
router.get('/:userId/invoices', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 100,
    });

    const formattedInvoices = invoices.data.map(invoice => ({
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
    logger.error('Error fetching invoices (admin)', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des factures' });
  }
});

module.exports = router;
