# 📊 Guide Tests & Monitoring - SaaS Immobilier

Ce guide vous explique comment utiliser les tests et le monitoring que nous avons mis en place.

---

## 🎯 Vue d'ensemble

Nous avons implémenté :
- ✅ **Tests Backend** (Jest + Supertest)
- ✅ **Tests Frontend** (Vitest + Testing Library)
- ✅ **Logging structuré** (Winston)
- ✅ **Error Tracking** (Sentry)
- ✅ **Health Check** endpoint
- ✅ **Error Handler** centralisé

---

## 📦 Installation

### Backend

```bash
cd saas-immo
npm install
```

Nouvelles dépendances ajoutées :
- `jest` - Framework de tests
- `supertest` - Tests HTTP
- `winston` - Logging
- `@sentry/node` - Error tracking

### Frontend

```bash
cd saas-immo-frontend
npm install
```

Nouvelles dépendances ajoutées :
- `vitest` - Framework de tests (compatible Vite)
- `@testing-library/react` - Tests de composants
- `@testing-library/user-event` - Simulation d'interactions
- `jsdom` - Environnement DOM pour tests

---

## 🧪 Exécution des Tests

### Backend

```bash
cd saas-immo

# Lancer tous les tests
npm test

# Mode watch (relance auto)
npm run test:watch

# Tests avec coverage
npm run test:ci
```

**Tests disponibles :**
- `tests/auth.test.js` - Authentification (register, login, rate limiting)
- `tests/properties.test.js` - Gestion des propriétés (CRUD)
- `tests/matching.test.js` - Algorithme de matching intelligent

### Frontend

```bash
cd saas-immo-frontend

# Lancer tous les tests
npm test

# Interface visuelle
npm run test:ui

# Tests avec coverage
npm run test:coverage
```

**Tests disponibles :**
- `src/tests/AddContactForm.test.jsx` - Formulaire d'ajout de contact
- `src/tests/auth.test.js` - Utilitaires d'authentification

---

## 📝 Logging avec Winston

### Configuration

Le logger est configuré dans `saas-immo/utils/logger.js`.

**Logs enregistrés dans :**
- `logs/error.log` - Erreurs uniquement
- `logs/combined.log` - Tous les logs
- Console (en développement)

### Utilisation dans le code

```javascript
const logger = require('./utils/logger');

// Log simple
logger.info('Information message');
logger.error('Error message');
logger.debug('Debug message');

// Log avec contexte
logger.info('User logged in', { userId: 123, ip: '127.0.0.1' });

// Helper pour logger les requêtes
logger.logRequest(req, 'Custom message');

// Helper pour logger les erreurs
logger.logError(error, req);
```

---

## 🔍 Sentry - Error Tracking

### Setup

1. **Créer un compte Sentry** (gratuit jusqu'à 5k events/mois)
   - Aller sur https://sentry.io
   - Créer un nouveau projet Node.js
   - Copier le DSN

2. **Ajouter le DSN dans Render**
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

3. **Intégrer dans server.js**

Au début de `server.js` (après les imports) :

```javascript
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');

// Initialiser Sentry
initSentry(app);

// Middlewares Sentry (AVANT toutes les routes)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// ... vos routes ici ...

// Error handler Sentry (APRÈS toutes les routes)
app.use(sentryErrorHandler());

// Votre error handler custom (en dernier)
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);
```

### Fonctionnalités Sentry

- 📊 **Dashboard des erreurs** avec stack traces
- 🔔 **Alertes email** sur nouvelles erreurs
- 📈 **Performance monitoring**
- 🔍 **Breadcrumbs** (historique avant l'erreur)
- 👥 **User context** (qui a eu l'erreur)

---

## 🏥 Health Check Endpoint

### Intégration dans server.js

Ajouter cette ligne dans `server.js` (avec vos autres routes) :

```javascript
const healthRouter = require('./routes/health');
app.use('/', healthRouter);
```

### Endpoints disponibles

**1. Health Check Simple**
```bash
GET /health

Response 200:
{
  "status": "ok",
  "timestamp": "2026-01-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

**2. Health Check Détaillé**
```bash
GET /health/detailed

Response 200:
{
  "status": "ok",
  "timestamp": "2026-01-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": { "status": "ok" },
    "supabase": { "status": "configured" },
    "resend": { "status": "configured" },
    "openai": { "status": "configured" },
    "stripe": { "status": "configured" },
    "webPush": { "status": "configured" }
  }
}
```

### Monitoring avec UptimeRobot

1. Créer un compte sur https://uptimerobot.com (gratuit)
2. Ajouter un monitor :
   - Type : HTTP(s)
   - URL : `https://saas-immo.onrender.com/health`
   - Interval : 5 minutes
3. Configurer les alertes email/SMS

---

## 🛠️ Middleware Error Handler

### Intégration dans server.js

```javascript
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');

// ... vos routes ...

// 404 handler (APRÈS toutes les routes)
app.use(notFoundHandler);

// Error handler global (EN DERNIER)
app.use(errorHandler);
```

### Utilisation avec asyncHandler

Pour éviter les try/catch répétitifs :

```javascript
const { asyncHandler } = require('./middleware/errorHandler');

// Avant
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const properties = await prisma.property.findMany();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Après (plus propre)
app.get('/api/properties', authenticateToken, asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany();
  res.json(properties);
}));
```

### Types d'erreurs gérées

- ✅ Validation errors
- ✅ JWT errors
- ✅ Prisma errors (duplicates, not found)
- ✅ Multer errors (upload)
- ✅ Custom errors avec statusCode

---

## 📊 Coverage des Tests

### Objectifs recommandés

- **Endpoints critiques** : >80% coverage
- **Fonctions métier** : >70% coverage
- **Utils** : >60% coverage

### Voir le coverage

```bash
# Backend
cd saas-immo
npm run test:ci
# Ouvrir coverage/index.html

# Frontend
cd saas-immo-frontend
npm run test:coverage
# Ouvrir coverage/index.html
```

---

## ✅ Checklist Déploiement

Avant de déployer en production :

- [ ] Tous les tests passent (`npm test`)
- [ ] Coverage > 70% sur endpoints critiques
- [ ] SENTRY_DSN configuré sur Render
- [ ] Health check accessible (`/health`)
- [ ] UptimeRobot configuré
- [ ] Logs Winston fonctionnels
- [ ] Error handler intégré
- [ ] Variables d'env configurées

---

## 🚀 Prochaines Étapes

1. **Ajouter plus de tests**
   - Tests E2E avec Playwright
   - Tests d'intégration base de données
   - Tests de performance

2. **Améliorer le monitoring**
   - Ajouter des métriques custom dans Sentry
   - Dashboard Grafana/Prometheus
   - APM (Application Performance Monitoring)

3. **CI/CD**
   - GitHub Actions pour lancer les tests auto
   - Déploiement auto si tests passent
   - Notifications Slack/Discord

---

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Sentry Docs](https://docs.sentry.io/platforms/node/)

---

## 🆘 Aide

**Tests échouent ?**
- Vérifier que `.env.test` existe
- S'assurer que les mocks sont corrects
- Regarder les logs d'erreur détaillés

**Sentry ne track pas ?**
- Vérifier que `SENTRY_DSN` est défini
- Vérifier que `NODE_ENV=production`
- Tester avec une erreur manuelle

**Health check 503 ?**
- Vérifier la connexion DB
- Regarder les logs du serveur
- Tester la connexion Prisma

---

Créé le 2026-01-19 | SaaS Immobilier v2.0
