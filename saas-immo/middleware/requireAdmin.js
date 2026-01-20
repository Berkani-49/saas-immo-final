const logger = require('../utils/logger');

/**
 * Middleware pour vérifier que l'utilisateur a le rôle ADMIN
 */
function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource',
      });
    }

    if (req.user.role !== 'ADMIN') {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous devez être administrateur pour accéder à cette ressource',
      });
    }

    next();
  } catch (error) {
    logger.error('Error in requireAdmin middleware', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la vérification des permissions' });
  }
}

module.exports = requireAdmin;
