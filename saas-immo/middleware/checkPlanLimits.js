const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

// Limites du plan gratuit par défaut
const FREE_PLAN_LIMITS = {
  maxProperties: 3,
  maxContacts: 5,
  maxEmployees: 0, // Pas d'employés sur le plan gratuit
  maxDiffusions: 0, // Pas de diffusion sur le plan gratuit
  maxSignatures: 0, // Pas de signatures sur le plan gratuit
};

/**
 * Middleware pour vérifier les limites du plan avant création de ressources
 */

/**
 * Vérifier la limite de propriétés
 */
async function checkPropertyLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agencyId;

    // Récupérer l'abonnement (par agence si disponible, fallback par user)
    let subscription = agencyId
      ? await prisma.subscription.findUnique({ where: { agencyId } })
      : null;
    if (!subscription) {
      subscription = await prisma.subscription.findUnique({ where: { userId } });
    }

    let maxProperties = FREE_PLAN_LIMITS.maxProperties;
    let planName = 'Gratuit';

    if (subscription) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: subscription.stripePriceId },
      });

      if (plan && plan.maxProperties === null) {
        return next();
      }

      if (plan) {
        maxProperties = plan.maxProperties;
        planName = subscription.planName;
      }
    }

    // Compter les propriétés de l'agence (ou du user si pas d'agence)
    const currentCount = await prisma.property.count({
      where: agencyId ? { agencyId } : { agentId: userId },
    });

    // Vérifier la limite
    if (currentCount >= maxProperties) {
      logger.warn('Property limit reached', { userId, currentCount, limit: maxProperties, plan: planName });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxProperties} biens pour votre plan ${planName}. Passez au plan supérieur pour en ajouter davantage.`,
        currentCount,
        limit: maxProperties,
        planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking property limit', { error: error.message, userId: req.user?.id });
    next();
  }
}

/**
 * Vérifier la limite de contacts
 */
async function checkContactLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agencyId;

    // Récupérer l'abonnement (par agence si disponible, fallback par user)
    let subscription = agencyId
      ? await prisma.subscription.findUnique({ where: { agencyId } })
      : null;
    if (!subscription) {
      subscription = await prisma.subscription.findUnique({ where: { userId } });
    }

    let maxContacts = FREE_PLAN_LIMITS.maxContacts;
    let planName = 'Gratuit';

    if (subscription) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: subscription.stripePriceId },
      });

      if (plan && plan.maxContacts === null) {
        return next();
      }

      if (plan) {
        maxContacts = plan.maxContacts;
        planName = subscription.planName;
      }
    }

    // Compter les contacts de l'agence (ou du user si pas d'agence)
    const currentCount = await prisma.contact.count({
      where: agencyId ? { agencyId } : { agentId: userId },
    });

    // Vérifier la limite
    if (currentCount >= maxContacts) {
      logger.warn('Contact limit reached', { userId, currentCount, limit: maxContacts, plan: planName });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxContacts} contacts pour votre plan ${planName}. Passez au plan supérieur pour en ajouter davantage.`,
        currentCount,
        limit: maxContacts,
        planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking contact limit', { error: error.message, userId: req.user?.id });
    next();
  }
}

/**
 * Vérifier la limite d'employés
 */
async function checkEmployeeLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agencyId;

    // Récupérer l'abonnement (par agence si disponible, fallback par user)
    let subscription = agencyId
      ? await prisma.subscription.findUnique({ where: { agencyId } })
      : null;
    if (!subscription) {
      subscription = await prisma.subscription.findUnique({ where: { userId } });
    }

    let maxEmployees = FREE_PLAN_LIMITS.maxEmployees;
    let planName = 'Gratuit';

    if (subscription) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: subscription.stripePriceId },
      });

      if (plan && plan.maxEmployees === null) {
        return next();
      }

      if (plan) {
        maxEmployees = plan.maxEmployees;
        planName = subscription.planName;
      }
    }

    // Compter les employés de l'agence
    const currentCount = agencyId
      ? await prisma.user.count({ where: { agencyId, role: 'EMPLOYEE' } })
      : 0;

    // Vérifier la limite
    if (currentCount >= maxEmployees) {
      logger.warn('Employee limit reached', { userId, currentCount, limit: maxEmployees, plan: planName });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxEmployees} membres d'équipe pour votre plan ${planName}. Passez au plan supérieur pour en ajouter davantage.`,
        currentCount,
        limit: maxEmployees,
        planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking employee limit', { error: error.message, userId: req.user?.id });
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
          message: `La fonctionnalité "${featureName}" nécessite un abonnement actif. Passez au plan Pro ou Premium.`,
          requiresSubscription: true,
          upgradeRequired: true,
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
          upgradeRequired: true,
        });
      }

      // Vérifier si la fonctionnalité est dans le plan
      const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;

      if (!features.includes(featureName) && !features[featureName]) {
        logger.warn('Feature not available for plan', { userId, feature: featureName, plan: subscription.planName });

        return res.status(403).json({
          error: 'Fonctionnalité non disponible',
          message: `La fonctionnalité "${featureName}" n'est pas disponible pour votre plan ${subscription.planName}. Passez au plan supérieur.`,
          planName: subscription.planName,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking feature availability', { error: error.message, userId: req.user?.id });
      next();
    }
  };
}

/**
 * Vérifier la limite de diffusions actives
 */
async function checkDiffusionLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agencyId;

    let subscription = agencyId
      ? await prisma.subscription.findUnique({ where: { agencyId } })
      : null;
    if (!subscription) {
      subscription = await prisma.subscription.findUnique({ where: { userId } });
    }

    let maxDiffusions = FREE_PLAN_LIMITS.maxDiffusions;
    let planName = 'Gratuit';

    if (subscription) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: subscription.stripePriceId },
      });

      if (plan && plan.maxDiffusions === null) {
        return next(); // illimité
      }

      if (plan) {
        maxDiffusions = plan.maxDiffusions;
        planName = subscription.planName;
      }
    }

    const currentCount = await prisma.propertyDiffusion.count({
      where: {
        ...(agencyId ? { agencyId } : { property: { agentId: userId } }),
        status: 'PUBLISHED',
      },
    });

    if (currentCount >= maxDiffusions) {
      logger.warn('Diffusion limit reached', { userId, currentCount, limit: maxDiffusions, plan: planName });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxDiffusions} diffusions actives pour votre plan ${planName}. Passez au plan supérieur pour en ajouter davantage.`,
        currentCount,
        limit: maxDiffusions,
        planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking diffusion limit', { error: error.message, userId: req.user?.id });
    next();
  }
}

/**
 * Vérifier la limite de signatures par mois
 */
async function checkSignatureLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agencyId;

    let subscription = agencyId
      ? await prisma.subscription.findUnique({ where: { agencyId } })
      : null;
    if (!subscription) {
      subscription = await prisma.subscription.findUnique({ where: { userId } });
    }

    let maxSignatures = FREE_PLAN_LIMITS.maxSignatures;
    let planName = 'Gratuit';

    if (subscription) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: subscription.stripePriceId },
      });

      if (plan && plan.maxSignatures === null) {
        return next(); // illimité
      }

      if (plan) {
        maxSignatures = plan.maxSignatures;
        planName = subscription.planName;
      }
    }

    // Compter les documents créés ce mois-ci
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentCount = await prisma.document.count({
      where: {
        ...(agencyId ? { agencyId } : { agentId: userId }),
        createdAt: { gte: startOfMonth },
      },
    });

    if (currentCount >= maxSignatures) {
      logger.warn('Signature limit reached', { userId, currentCount, limit: maxSignatures, plan: planName });

      return res.status(403).json({
        error: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxSignatures} signatures ce mois-ci pour votre plan ${planName}. Passez au plan supérieur pour en créer davantage.`,
        currentCount,
        limit: maxSignatures,
        planName,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking signature limit', { error: error.message, userId: req.user?.id });
    next();
  }
}

module.exports = {
  checkPropertyLimit,
  checkContactLimit,
  checkEmployeeLimit,
  checkDiffusionLimit,
  checkSignatureLimit,
  requireFeature,
  FREE_PLAN_LIMITS,
};
