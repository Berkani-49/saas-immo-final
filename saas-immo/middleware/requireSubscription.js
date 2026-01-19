const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Middleware pour vérifier qu'un utilisateur a un abonnement actif
 * À utiliser sur les routes qui nécessitent un abonnement payant
 */
async function requireSubscription(req, res, next) {
  try {
    const userId = req.user.id;

    // Récupérer l'abonnement de l'utilisateur
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    // Vérifier si l'abonnement existe et est actif
    if (!subscription) {
      return res.status(403).json({
        error: 'Abonnement requis',
        message: 'Cette fonctionnalité nécessite un abonnement actif',
        requiresSubscription: true,
      });
    }

    // Vérifier le statut de l'abonnement
    const activeStatuses = ['active', 'trialing'];
    if (!activeStatuses.includes(subscription.status)) {
      return res.status(403).json({
        error: 'Abonnement inactif',
        message: 'Votre abonnement n\'est plus actif. Veuillez le renouveler pour continuer',
        requiresSubscription: true,
        subscriptionStatus: subscription.status,
      });
    }

    // Vérifier que l'abonnement n'est pas expiré
    const now = new Date();
    if (subscription.currentPeriodEnd < now && subscription.status !== 'trialing') {
      return res.status(403).json({
        error: 'Abonnement expiré',
        message: 'Votre abonnement a expiré. Veuillez le renouveler',
        requiresSubscription: true,
        expiresAt: subscription.currentPeriodEnd,
      });
    }

    // Ajouter les informations d'abonnement à la requête
    req.subscription = subscription;

    next();
  } catch (error) {
    logger.error('Error checking subscription', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'abonnement' });
  }
}

/**
 * Middleware pour vérifier le plan d'abonnement minimum requis
 * Usage: requirePlan('pro') ou requirePlan(['pro', 'premium'])
 */
function requirePlan(allowedPlans) {
  const plans = Array.isArray(allowedPlans) ? allowedPlans : [allowedPlans];

  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const subscription = await prisma.subscription.findUnique({
        where: { userId: userId },
      });

      if (!subscription || !plans.includes(subscription.planName)) {
        return res.status(403).json({
          error: 'Plan insuffisant',
          message: `Cette fonctionnalité nécessite un plan ${plans.join(' ou ')}`,
          currentPlan: subscription?.planName || 'aucun',
          requiredPlans: plans,
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      logger.error('Error checking plan', { error: error.message, userId: req.user?.id });
      res.status(500).json({ error: 'Erreur lors de la vérification du plan' });
    }
  };
}

/**
 * Middleware optionnel pour enrichir req.user avec les infos d'abonnement
 * N'empêche pas l'accès mais ajoute les informations
 */
async function enrichWithSubscription(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    req.subscription = subscription;
    req.hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);

    next();
  } catch (error) {
    logger.error('Error enriching with subscription', { error: error.message });
    // Ne pas bloquer en cas d'erreur
    next();
  }
}

module.exports = {
  requireSubscription,
  requirePlan,
  enrichWithSubscription,
};
