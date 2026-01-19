# 🔧 Instructions d'Intégration - Tests & Monitoring

Ce fichier explique comment intégrer les nouveaux composants dans votre `server.js`.

---

## 📝 Modifications à apporter à server.js

### 1️⃣ Ajouter les imports en haut du fichier

**Après les imports existants** (ligne ~20), ajouter :

```javascript
// Nouveaux imports pour monitoring et error handling
const logger = require('./utils/logger');
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
```

### 2️⃣ Initialiser Sentry

**Juste après la création de l'app** (ligne ~22), ajouter :

```javascript
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Initialiser Sentry (dès le début)
initSentry(app);
```

### 3️⃣ Ajouter les middlewares Sentry

**Juste après les middlewares CORS** (ligne ~120), ajouter :

```javascript
// CORS middleware (existant)
app.use(corsMiddleware);
app.use(optionsMiddleware);

// Sentry Request Handler (AVANT toutes les routes)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Logger middleware - Log toutes les requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});
```

### 4️⃣ Ajouter la route Health Check

**Avec vos autres routes** (après les routes existantes), ajouter :

```javascript
// Health Check (pour monitoring uptime)
app.use('/', healthRouter);
```

### 5️⃣ Ajouter les Error Handlers

**TOUT À LA FIN, juste avant `app.listen`** (ligne ~3793), ajouter :

```javascript
// ========================================
// ERROR HANDLING
// ========================================

// Sentry Error Handler (AVANT votre error handler)
app.use(sentryErrorHandler());

// 404 Handler - Route non trouvée
app.use(notFoundHandler);

// Error Handler Global (EN DERNIER)
app.use(errorHandler);

// DÉMARRAGE
app.listen(PORT, () => {
  console.log(`✅ Serveur OK sur port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
  // ... vos autres logs
});
```

---

## 🔄 Exemple Complet d'Intégration

Voici un exemple de structure complète de `server.js` :

```javascript
// ========================================
// 1. IMPORTS
// ========================================
require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
// ... autres imports existants

// Nouveaux imports
const logger = require('./utils/logger');
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');

// ========================================
// 2. INITIALISATION
// ========================================
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Initialiser Sentry
initSentry(app);

// ========================================
// 3. MIDDLEWARES GLOBAUX
// ========================================
app.use(express.json());
// ... vos middlewares CORS existants

// Sentry middlewares
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ========================================
// 4. ROUTES
// ========================================

// Health Check
app.use('/', healthRouter);

// Vos routes existantes
app.post('/api/auth/register', ...);
app.post('/api/auth/login', ...);
// ... toutes vos autres routes

// ========================================
// 5. ERROR HANDLING (À LA FIN)
// ========================================

// Sentry Error Handler
app.use(sentryErrorHandler());

// 404 Handler
app.use(notFoundHandler);

// Error Handler Global
app.use(errorHandler);

// ========================================
// 6. DÉMARRAGE
// ========================================
app.listen(PORT, () => {
  console.log(`✅ Serveur OK sur port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});
```

---

## 🚀 Utiliser asyncHandler pour simplifier le code

Au lieu de répéter des try/catch partout, utilisez `asyncHandler` :

### ❌ Avant (répétitif)

```javascript
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { userId: req.user.id }
    });
    res.json(properties);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### ✅ Après (plus propre)

```javascript
app.get('/api/properties', authenticateToken, asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany({
    where: { userId: req.user.id }
  });
  res.json(properties);
  // Les erreurs sont automatiquement catchées et envoyées au error handler
}));
```

---

## 📊 Utiliser le Logger

Remplacez vos `console.log` et `console.error` par le logger :

### ❌ Avant

```javascript
console.log('Propriété créée:', property.id);
console.error('Erreur création:', error);
```

### ✅ Après

```javascript
logger.info('Propriété créée', { propertyId: property.id });
logger.error('Erreur création', { error: error.message, stack: error.stack });

// Ou utilisez les helpers
logger.logRequest(req, 'Création de propriété');
logger.logError(error, req);
```

---

## 🔐 Variables d'Environnement Requises

Ajoutez ces variables dans Render :

```bash
# Sentry (optionnel mais recommandé en production)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Déjà existantes (vérifier qu'elles sont présentes)
JWT_SECRET=votre-secret-jwt
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## ✅ Checklist d'Intégration

- [ ] Installer les dépendances (`npm install`)
- [ ] Ajouter les imports dans server.js
- [ ] Initialiser Sentry
- [ ] Ajouter les middlewares Sentry et Logger
- [ ] Ajouter la route Health Check
- [ ] Ajouter les error handlers (à la fin)
- [ ] Créer le dossier `logs/` à la racine du backend
- [ ] Tester le health check : `curl http://localhost:3000/health`
- [ ] Lancer les tests : `npm test`
- [ ] Configurer SENTRY_DSN sur Render (si vous voulez Sentry)
- [ ] Déployer sur Render
- [ ] Vérifier que `/health` fonctionne en production

---

## 🧪 Tests Rapides Après Intégration

```bash
# 1. Installer les dépendances
cd saas-immo
npm install

# 2. Créer le dossier logs
mkdir -p logs

# 3. Lancer les tests
npm test

# 4. Démarrer le serveur
npm start

# 5. Tester le health check (dans un autre terminal)
curl http://localhost:3000/health

# 6. Tester le health check détaillé
curl http://localhost:3000/health/detailed
```

---

## 🆘 Dépannage

**Erreur "Cannot find module './utils/logger'"**
→ Vérifiez que les fichiers `utils/logger.js`, `utils/sentry.js` et `middleware/errorHandler.js` existent

**Erreur "logs is not writable"**
→ Créez le dossier : `mkdir logs`

**Tests échouent**
→ Vérifiez que `.env.test` existe et contient JWT_SECRET

**Health check retourne 503**
→ Vérifiez la connexion à la base de données

---

Bon courage ! 🚀
