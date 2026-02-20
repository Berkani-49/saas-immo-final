const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { requirePlan } = require('../middleware/requireSubscription');
const { checkDiffusionLimit } = require('../middleware/checkPlanLimits');

// Liste des portails disponibles
const PORTALS = [
  { id: 'SELOGER', name: 'SeLoger', color: '#E74C3C' },
  { id: 'LEBONCOIN', name: 'LeBonCoin', color: '#FF6600' },
  { id: 'BIENICI', name: "Bien'ici", color: '#00B4D8' },
  { id: 'LOGICIMMO', name: 'Logic-Immo', color: '#1ABC9C' },
  { id: 'PAP', name: 'PAP', color: '#9B59B6' },
  { id: 'FIGARO', name: 'Le Figaro Immobilier', color: '#2C3E50' },
];

/**
 * GET /api/diffusion/portals
 * Liste des portails disponibles
 */
router.get('/portals', requirePlan(['pro', 'premium']), (req, res) => {
  res.json({ portals: PORTALS });
});

/**
 * GET /api/diffusion/properties
 * Liste des biens avec leurs statuts de diffusion
 */
router.get('/properties', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const properties = await prisma.property.findMany({
      where: agencyId ? { agencyId } : { agentId: userId },
      include: {
        diffusions: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = properties.map((p) => ({
      id: p.id,
      address: p.address,
      city: p.city,
      price: p.price,
      area: p.area,
      rooms: p.rooms,
      propertyType: p.propertyType,
      imageUrl: p.images[0]?.url || p.imageUrl,
      diffusions: PORTALS.map((portal) => {
        const diff = p.diffusions.find((d) => d.portal === portal.id);
        return {
          portal: portal.id,
          portalName: portal.name,
          portalColor: portal.color,
          status: diff?.status || 'NOT_PUBLISHED',
          publishedAt: diff?.publishedAt || null,
        };
      }),
    }));

    res.json({ properties: result });
  } catch (error) {
    logger.error('Error fetching diffusion properties', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des biens' });
  }
});

/**
 * GET /api/diffusion/properties/:id/portals
 * Statuts de diffusion pour un bien spécifique
 */
router.get('/properties/:id/portals', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
      include: { diffusions: true },
    });

    if (!property) {
      return res.status(404).json({ error: 'Bien non trouvé' });
    }

    const portals = PORTALS.map((portal) => {
      const diff = property.diffusions.find((d) => d.portal === portal.id);
      return {
        portal: portal.id,
        portalName: portal.name,
        portalColor: portal.color,
        status: diff?.status || 'NOT_PUBLISHED',
        publishedAt: diff?.publishedAt || null,
        expiresAt: diff?.expiresAt || null,
        errorMessage: diff?.errorMessage || null,
      };
    });

    res.json({ portals });
  } catch (error) {
    logger.error('Error fetching property portals', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des portails' });
  }
});

/**
 * POST /api/diffusion/properties/:id/publish
 * Publier un bien sur un ou tous les portails
 * Body: { portals: ["SELOGER", "LEBONCOIN"] } ou { all: true }
 */
router.post('/properties/:id/publish', requirePlan(['pro', 'premium']), checkDiffusionLimit, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;
    const { portals: targetPortals, all } = req.body;

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Bien non trouvé' });
    }

    const portalIds = all
      ? PORTALS.map((p) => p.id)
      : (targetPortals || []);

    const validPortals = portalIds.filter((p) => PORTALS.some((portal) => portal.id === p));

    if (validPortals.length === 0) {
      return res.status(400).json({ error: 'Aucun portail valide spécifié' });
    }

    const results = [];
    for (const portal of validPortals) {
      const diffusion = await prisma.propertyDiffusion.upsert({
        where: { propertyId_portal: { propertyId, portal } },
        update: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          errorMessage: null,
        },
        create: {
          propertyId,
          portal,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          agencyId: agencyId || null,
        },
      });
      results.push(diffusion);
    }

    // Log activité
    await prisma.activityLog.create({
      data: {
        action: 'DIFFUSION_PUBLISHED',
        description: `Bien "${property.address}" publié sur ${validPortals.length} portail(s)`,
        agentId: userId,
        agencyId: agencyId || null,
      },
    });

    logger.info('Property published', { propertyId, portals: validPortals, userId });
    res.json({ message: 'Publication effectuée', diffusions: results });
  } catch (error) {
    logger.error('Error publishing property', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la publication' });
  }
});

/**
 * POST /api/diffusion/properties/:id/unpublish
 * Retirer un bien d'un ou tous les portails
 * Body: { portals: ["SELOGER"] } ou { all: true }
 */
router.post('/properties/:id/unpublish', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;
    const { portals: targetPortals, all } = req.body;

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Bien non trouvé' });
    }

    const portalIds = all
      ? PORTALS.map((p) => p.id)
      : (targetPortals || []);

    await prisma.propertyDiffusion.updateMany({
      where: {
        propertyId,
        portal: { in: portalIds },
      },
      data: {
        status: 'NOT_PUBLISHED',
        publishedAt: null,
      },
    });

    // Log activité
    await prisma.activityLog.create({
      data: {
        action: 'DIFFUSION_UNPUBLISHED',
        description: `Bien "${property.address}" retiré de ${portalIds.length} portail(s)`,
        agentId: userId,
        agencyId: agencyId || null,
      },
    });

    logger.info('Property unpublished', { propertyId, portals: portalIds, userId });
    res.json({ message: 'Retrait effectué' });
  } catch (error) {
    logger.error('Error unpublishing property', { error: error.message });
    res.status(500).json({ error: 'Erreur lors du retrait' });
  }
});

/**
 * GET /api/diffusion/stats
 * Statistiques globales de diffusion
 */
router.get('/stats', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const filter = agencyId ? { agencyId } : { property: { agentId: userId } };

    const [totalPublished, byPortal, totalProperties] = await Promise.all([
      prisma.propertyDiffusion.count({
        where: { ...filter, status: 'PUBLISHED' },
      }),
      prisma.propertyDiffusion.groupBy({
        by: ['portal'],
        where: { ...filter, status: 'PUBLISHED' },
        _count: { id: true },
      }),
      prisma.property.count({
        where: agencyId ? { agencyId } : { agentId: userId },
      }),
    ]);

    const portalStats = PORTALS.map((portal) => {
      const stat = byPortal.find((s) => s.portal === portal.id);
      return {
        portal: portal.id,
        portalName: portal.name,
        portalColor: portal.color,
        count: stat?._count?.id || 0,
      };
    });

    res.json({
      totalPublished,
      totalProperties,
      portals: portalStats,
    });
  } catch (error) {
    logger.error('Error fetching diffusion stats', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
