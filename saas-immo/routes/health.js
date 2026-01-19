const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Health Check Simple
 * GET /health
 * Retourne 200 OK si le serveur fonctionne
 */
router.get('/health', async (req, res) => {
  try {
    // Test de connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Health Check Détaillé (optionnel pour debug)
 * GET /health/detailed
 * Vérifie tous les services
 */
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {}
  };

  // Vérifier la base de données
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = { status: 'ok' };
  } catch (error) {
    health.status = 'degraded';
    health.services.database = { status: 'error', message: error.message };
  }

  // Vérifier Supabase
  health.services.supabase = {
    status: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured'
  };

  // Vérifier Resend
  health.services.resend = {
    status: process.env.RESEND_API_KEY ? 'configured' : 'not configured'
  };

  // Vérifier OpenAI
  health.services.openai = {
    status: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
  };

  // Vérifier Stripe
  health.services.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'
  };

  // Vérifier Web Push
  health.services.webPush = {
    status: process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? 'configured' : 'not configured'
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
