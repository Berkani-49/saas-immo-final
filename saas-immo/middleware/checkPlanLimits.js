const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Middleware pour vérifier les limites du plan avant création de ressources
 */

/**
 * Vérifier la limite de propriétés
 */
async function checkPropertyLimit(req, res, next) {
  try {
    const userId = req.user.id;

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Pas d'abonnement = plan gratuit (limite 0)
      return res.status(403).json({
        error: 'Limite atteinte',
        message: 'Vous devez avoir un abonnement actif pour créer des propriétés',
        requiresSubscription: true,
      });
    }

    // Récupérer le plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: subscription.stripePriceId },
    });

    // Si pas de limite (null) = illimité
    if (!plan || plan.maxProperties === null) {
      return next();
    }

    // Compter les propriétés actuelles
    const currentCount = await prisma.property.count({
      where: { agentId: userId },
    });

    // Vérifier la limite
    if (currentCount >= plan.maxProperties) {
      logger.warn('Property limit reached', { userId, currentCount, limit: plan.maxProperties });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${plan.maxProperties} propriétés pour votre plan ${subscription.planName}`,
        currentCount,
        limit: plan.maxProperties,
        planName: subscription.planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking property limit', { error: error.message, userId: req.user?.id });
    // En cas d'erreur, laisser passer pour ne pas bloquer l'utilisateur
    next();
  }
}

/**
 * Vérifier la limite de contacts
 */
async function checkContactLimit(req, res, next) {
  try {
    const userId = req.user.id;

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Pas d'abonnement = plan gratuit (limite 0)
      return res.status(403).json({
        error: 'Limite atteinte',
        message: 'Vous devez avoir un abonnement actif pour créer des contacts',
        requiresSubscription: true,
      });
    }

    // Récupérer le plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: subscription.stripePriceId },
    });

    // Si pas de limite (null) = illimité
    if (!plan || plan.maxContacts === null) {
      return next();
    }

    // Compter les contacts actuels
    const currentCount = await prisma.contact.count({
      where: { agentId: userId },
    });

    // Vérifier la limite
    if (currentCount >= plan.maxContacts) {
      logger.warn('Contact limit reached', { userId, currentCount, limit: plan.maxContacts });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${plan.maxContacts} contacts pour votre plan ${subscription.planName}`,
        currentCount,
        limit: plan.maxContacts,
        planName: subscription.planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking contact limit', { error: error.message, userId: req.user?.id });
    // En cas d'erreur, laisser passer pour ne pas bloquer l'utilisateur
    next();
  }
}

/**
 * Vérifier la limite d'employés
 */
async function checkEmployeeLimit(req, res, next) {
  try {
    const userId = req.user.id;

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(403).json({
        error: 'Limite atteinte',
        message: 'Vous devez avoir un abonnement actif pour ajouter des employés',
        requiresSubscription: true,
      });
    }

    // Récupérer le plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: subscription.stripePriceId },
    });

    // Si pas de limite (null) = illimité
    if (!plan || plan.maxEmployees === null) {
      return next();
    }

    // Compter les employés actuels (à adapter selon votre logique)
    const currentCount = await prisma.user.count({
      where: {
        role: 'EMPLOYEE',
        // Ajoutez ici la logique pour lier les employés à l'agence
      },
    });

    // Vérifier la limite
    if (currentCount >= plan.maxEmployees) {
      logger.warn('Employee limit reached', { userId, currentCount, limit: plan.maxEmployees });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${plan.maxEmployees} employés pour votre plan ${subscription.planName}`,
        currentCount,
        limit: plan.maxEmployees,
        planName: subscription.planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking employee limit', { error: error.message, userId: req.user?.id });
    // En cas d'erreur, laisser passer pour ne pas bloquer l'utilisateur
    next();
  }
}

/**
 * Vérifier si une fonctionnalité est disponible pour le plan actuel
 */
function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Récupérer l'abonnement
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        return res.status(403).json({
          error: 'Fonctionnalité non disponible',
          message: `La fonctionnalité "${featureName}" nécessite un abonnement actif`,
          requiresSubscription: true,
        });
      }

      // Récupérer le plan
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: subscription.stripePriceId },
      });

      if (!plan || !plan.features) {
        return res.status(403).json({
          error: 'Fonctionnalité non disponible',
          message: `La fonctionnalité "${featureName}" n'est pas disponible pour votre plan`,
        });
      }

      // Vérifier si la fonctionnalité est dans le plan
      const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;

      if (!features.includes(featureName) && !features[featureName]) {
        logger.warn('Feature not available for plan', { userId, feature: featureName, plan: subscription.planName });

        return res.status(403).json({
          error: 'Fonctionnalité non disponible',
          message: `La fonctionnalité "${featureName}" n'est pas disponible pour votre plan ${subscription.planName}`,
          planName: subscription.planName,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking feature availability', { error: error.message, userId: req.user?.id });
      // En cas d'erreur, laisser passer pour ne pas bloquer l'utilisateur
      next();
    }
  };
}

module.exports = {
  checkPropertyLimit,
  checkContactLimit,
  checkEmployeeLimit,
  requireFeature,
};
