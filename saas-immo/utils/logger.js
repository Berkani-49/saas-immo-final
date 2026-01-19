const winston = require('winston');

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Configuration différente selon l'environnement
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'saas-immo-api' },
  transports: [
    // Logs d'erreur dans un fichier séparé
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Tous les logs dans combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// En développement, on log aussi dans la console avec couleurs
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper functions pour faciliter l'usage
logger.logRequest = (req, message = 'Request received') => {
  logger.info(message, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id
  });
};

logger.logError = (error, req = null) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.id
    })
  };
  logger.error('Error occurred', errorLog);
};

module.exports = logger;
