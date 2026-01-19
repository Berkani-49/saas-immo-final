const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Service pour gérer les interactions avec Stripe
 */

/**
 * Créer ou récupérer un client Stripe pour un utilisateur
 */
async function getOrCreateStripeCustomer(user) {
  try {
    // Si l'utilisateur a déjà un ID client Stripe, le retourner
    if (user.stripeCustomerId) {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      return customer;
    }

    // Sinon, créer un nouveau client Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user.id.toString(),
        role: user.role
      }
    });

    // Sauvegarder l'ID client Stripe dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id }
    });

    logger.info('Stripe customer created', { userId: user.id, customerId: customer.id });

    return customer;
  } catch (error) {
    logger.error('Error creating Stripe customer', { error: error.message, userId: user.id });
    throw error;
  }
}

/**
 * Créer une session de checkout Stripe
 */
async function createCheckoutSession(user, priceId, successUrl, cancelUrl) {
  try {
    const customer = await getOrCreateStripeCustomer(user);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id.toString(),
      },
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
        },
      },
    });

    logger.info('Checkout session created', { userId: user.id, sessionId: session.id });

    return session;
  } catch (error) {
    logger.error('Error creating checkout session', { error: error.message, userId: user.id });
    throw error;
  }
}

/**
 * Créer une session de portail de facturation
 */
async function createBillingPortalSession(user, returnUrl) {
  try {
    if (!user.stripeCustomerId) {
      throw new Error('User has no Stripe customer ID');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    logger.info('Billing portal session created', { userId: user.id });

    return session;
  } catch (error) {
    logger.error('Error creating billing portal session', { error: error.message, userId: user.id });
    throw error;
  }
}

/**
 * Annuler un abonnement à la fin de la période
 */
async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    logger.info('Subscription set to cancel at period end', { subscriptionId });

    return subscription;
  } catch (error) {
    logger.error('Error canceling subscription', { error: error.message, subscriptionId });
    throw error;
  }
}

/**
 * Réactiver un abonnement annulé
 */
async function reactivateSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    logger.info('Subscription reactivated', { subscriptionId });

    return subscription;
  } catch (error) {
    logger.error('Error reactivating subscription', { error: error.message, subscriptionId });
    throw error;
  }
}

/**
 * Récupérer les informations d'un abonnement Stripe
 */
async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error('Error retrieving subscription', { error: error.message, subscriptionId });
    throw error;
  }
}

/**
 * Lister les factures d'un client
 */
async function listInvoices(customerId, limit = 10) {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limit,
    });

    return invoices.data;
  } catch (error) {
    logger.error('Error listing invoices', { error: error.message, customerId });
    throw error;
  }
}

/**
 * Vérifier si un utilisateur a un abonnement actif
 */
async function hasActiveSubscription(userId) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return false;
    }

    // Vérifier si l'abonnement est actif ou en période d'essai
    return ['active', 'trialing'].includes(subscription.status);
  } catch (error) {
    logger.error('Error checking active subscription', { error: error.message, userId });
    return false;
  }
}

/**
 * Mettre à jour le statut d'abonnement d'un utilisateur
 */
async function updateUserSubscriptionStatus(userId, status, endDate = null) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: status,
        subscriptionEndDate: endDate,
      },
    });

    logger.info('User subscription status updated', { userId, status });
  } catch (error) {
    logger.error('Error updating user subscription status', { error: error.message, userId });
    throw error;
  }
}

module.exports = {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscription,
  listInvoices,
  hasActiveSubscription,
  updateUserSubscriptionStatus,
};
