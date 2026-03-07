const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialise Sentry pour le tracking d'erreurs
 * À appeler au démarrage de l'application
 */
function initSentry(app) {
  // Ne pas initialiser en développement ou si pas de DSN
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    console.log('ℹ️  Sentry non initialisé (mode dev ou SENTRY_DSN manquant)');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% des transactions en production

    // Profiling (optionnel)
    profilesSampleRate: 0.1,
    integrations: [
      // Intégrations automatiques pour Node.js
      Sentry.httpIntegration({ tracing: true }),
      Sentry.nativeNodeFetchIntegration(),
      Sentry.graphqlIntegration(),
      Sentry.mongoIntegration(),
      Sentry.postgresIntegration(),
      Sentry.redisIntegration(),
      nodeProfilingIntegration()
    ],

    // Filtrer les informations sensibles
    beforeSend(event, hint) {
      // Ne pas logger les mots de passe
      if (event.request) {
        if (event.request.data) {
          delete event.request.data.password;
          delete event.request.data.token;
        }
      }
      return event;
    },

    // Ignorer certaines erreurs non critiques
    ignoreErrors: [
      'ValidationError',
      'Token manquant',
      'Non autorisé'
    ]
  });

  console.log('✅ Sentry initialisé avec succès');
}

/**
 * Middleware de request handler Sentry
 * En Sentry v8, httpIntegration() gère le tracing automatiquement — middleware noop
 */
const sentryRequestHandler = () => {
  return (req, res, next) => next();
};

/**
 * Middleware de tracing Sentry
 * En Sentry v8, supprimé — middleware noop
 */
const sentryTracingHandler = () => {
  return (req, res, next) => next();
};

/**
 * Middleware d'error handler Sentry
 * En Sentry v8, Sentry.Handlers a été supprimé — on capture manuellement
 */
const sentryErrorHandler = () => {
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    return (err, req, res, next) => next(err);
  }
  return (err, req, res, next) => {
    Sentry.captureException(err);
    next(err);
  };
};

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  Sentry
};
