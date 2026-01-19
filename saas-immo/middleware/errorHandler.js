const logger = require('../utils/logger');
const Sentry = require('@sentry/node');

/**
 * Middleware centralisé de gestion des erreurs
 * À placer en dernier dans la chaîne de middlewares
 */
const errorHandler = (err, req, res, next) => {
  // Logger l'erreur
  logger.logError(err, req);

  // Envoyer à Sentry en production (si configuré)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // Déterminer le code de statut
  const statusCode = err.statusCode || err.status || 500;

  // Préparer la réponse d'erreur
  const errorResponse = {
    success: false,
    message: err.message || 'Une erreur est survenue',
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      details: err.details
    })
  };

  // Gestion spécifique selon le type d'erreur
  switch (err.name) {
    case 'ValidationError':
      errorResponse.message = 'Erreur de validation des données';
      errorResponse.errors = err.errors;
      return res.status(400).json(errorResponse);

    case 'UnauthorizedError':
    case 'JsonWebTokenError':
      errorResponse.message = 'Token invalide ou expiré';
      return res.status(401).json(errorResponse);

    case 'PrismaClientKnownRequestError':
      // Erreurs Prisma spécifiques
      if (err.code === 'P2002') {
        errorResponse.message = 'Cette valeur existe déjà';
      } else if (err.code === 'P2025') {
        errorResponse.message = 'Ressource non trouvée';
      }
      return res.status(400).json(errorResponse);

    case 'MulterError':
      // Erreurs d'upload de fichiers
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorResponse.message = 'Fichier trop volumineux (max 5MB)';
      } else {
        errorResponse.message = 'Erreur lors de l\'upload du fichier';
      }
      return res.status(400).json(errorResponse);

    default:
      return res.status(statusCode).json(errorResponse);
  }
};

/**
 * Handler pour les routes non trouvées (404)
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Wrapper async pour éviter les try/catch répétitifs
 * Usage: app.get('/route', asyncHandler(async (req, res) => {...}))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
