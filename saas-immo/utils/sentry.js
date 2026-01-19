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
      // Intégration Express automatique
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
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
 * À placer AVANT toutes les routes
 */
const sentryRequestHandler = () => {
  // Si Sentry n'est pas initialisé, retourner un middleware vide
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
};

/**
 * Middleware de tracing Sentry
 * À placer AVANT toutes les routes
 */
const sentryTracingHandler = () => {
  // Si Sentry n'est pas initialisé, retourner un middleware vide
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Middleware d'error handler Sentry
 * À placer APRÈS toutes les routes mais AVANT votre error handler custom
 */
const sentryErrorHandler = () => {
  // Si Sentry n'est pas initialisé, retourner un middleware vide
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler();
};

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  Sentry
};
