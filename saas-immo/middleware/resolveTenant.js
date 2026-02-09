// Middleware : resolveTenant
// Résout le tenant (agence) à partir du sous-domaine ou du header X-Tenant-Slug (dev)
// Set req.agency = { id, name, slug, ... } ou null

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APP_DOMAIN = process.env.APP_DOMAIN; // ex: "immoflow.fr"

function resolveTenant(req, res, next) {
  // 1. Extraire le slug depuis le sous-domaine
  let slug = null;

  if (APP_DOMAIN) {
    const host = req.hostname; // ex: "agence-dupont.immoflow.fr"
    const suffix = '.' + APP_DOMAIN;
    if (host.endsWith(suffix)) {
      slug = host.slice(0, -suffix.length); // "agence-dupont"
    }
  }

  // 2. Fallback : header X-Tenant-Slug (pour le dev/test)
  if (!slug && req.headers['x-tenant-slug']) {
    slug = req.headers['x-tenant-slug'];
  }

  // 3. Pas de slug → pas de tenant (mode legacy, app principale)
  if (!slug) {
    req.agency = null;
    return next();
  }

  // 4. Chercher l'agence dans la DB
  prisma.agency.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, isActive: true, logoUrl: true, primaryColor: true }
  })
    .then(agency => {
      if (!agency) {
        return res.status(404).json({ error: 'Agence introuvable.' });
      }
      if (!agency.isActive) {
        return res.status(403).json({ error: 'Cette agence est désactivée.' });
      }
      req.agency = agency;
      next();
    })
    .catch(err => {
      console.error('Erreur resolveTenant:', err);
      next(); // En cas d'erreur DB, on continue sans tenant
    });
}

module.exports = resolveTenant;
