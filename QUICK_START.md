# ⚡ Quick Start - Tests & Monitoring

## 🚀 Installation Rapide (5 minutes)

### Backend
```bash
cd saas-immo
npm install
mkdir -p logs
```

### Frontend
```bash
cd saas-immo-frontend
npm install
```

---

## 🧪 Lancer les Tests

### Backend
```bash
cd saas-immo

# Tous les tests
npm test

# Mode watch (relance auto)
npm run test:watch

# Avec coverage
npm run test:ci
```

### Frontend
```bash
cd saas-immo-frontend

# Tous les tests
npm test

# Interface UI
npm run test:ui

# Avec coverage
npm run test:coverage
```

---

## 🔧 Intégration dans server.js

### Étape 1 : Ajouter les imports (en haut du fichier)

```javascript
const logger = require('./utils/logger');
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
```

### Étape 2 : Initialiser Sentry (après création de l'app)

```javascript
const app = express();
initSentry(app);
```

### Étape 3 : Ajouter middlewares (après CORS)

```javascript
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});
```

### Étape 4 : Ajouter route health check (avec vos routes)

```javascript
app.use('/', healthRouter);
```

### Étape 5 : Error handlers (TOUT À LA FIN, avant app.listen)

```javascript
app.use(sentryErrorHandler());
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`✅ Serveur OK sur port ${PORT}`);
});
```

---

## 🌐 Configurer Sentry (Optionnel)

1. **Créer compte** : https://sentry.io (gratuit)
2. **Créer projet** Node.js
3. **Copier DSN** et l'ajouter sur Render :
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

---

## 🏥 Tester le Health Check

```bash
# Local
curl http://localhost:3000/health

# Production
curl https://saas-immo.onrender.com/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 📊 Monitoring avec UptimeRobot

1. Aller sur https://uptimerobot.com
2. Créer un monitor HTTP(s)
3. URL : `https://saas-immo.onrender.com/health`
4. Interval : 5 minutes
5. Configurer alertes email

---

## 📝 Utiliser le Logger dans votre code

### Remplacer console.log

```javascript
// ❌ Avant
console.log('Utilisateur connecté:', userId);
console.error('Erreur:', error);

// ✅ Après
logger.info('Utilisateur connecté', { userId });
logger.error('Erreur', { error: error.message });
```

### Helpers disponibles

```javascript
// Logger une requête
logger.logRequest(req, 'Description de l\'action');

// Logger une erreur avec contexte
logger.logError(error, req);
```

---

## 🛡️ Utiliser asyncHandler

```javascript
const { asyncHandler } = require('./middleware/errorHandler');

// ❌ Avant (try/catch répétitif)
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const properties = await prisma.property.findMany();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Après (plus propre)
app.get('/api/properties', authenticateToken, asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany();
  res.json(properties);
}));
```

---

## ✅ Checklist Avant Déploiement

- [ ] `npm install` executé (backend + frontend)
- [ ] Dossier `logs/` créé
- [ ] Tests passent : `npm test`
- [ ] Intégration server.js faite
- [ ] Health check testé localement
- [ ] Variables d'env sur Render :
  - [ ] `JWT_SECRET`
  - [ ] `DATABASE_URL`
  - [ ] `RESEND_API_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SENTRY_DSN` (optionnel)
- [ ] Déployé sur Render
- [ ] Health check accessible en prod
- [ ] UptimeRobot configuré (optionnel)

---

## 🧪 Tests Rapides

```bash
# Backend - Tests unitaires
cd saas-immo && npm test

# Frontend - Tests composants
cd saas-immo-frontend && npm test

# Health Check local
curl http://localhost:3000/health

# Health Check production
curl https://saas-immo.onrender.com/health
```

---

## 📚 Documentation Complète

- **Guide détaillé** : `TESTING_MONITORING_GUIDE.md`
- **Intégration** : `saas-immo/INTEGRATION_INSTRUCTIONS.md`
- **Résumé** : `SUMMARY.md`

---

## 🆘 Problèmes Courants

**Tests échouent ?**
```bash
# Vérifier que .env.test existe
ls saas-immo/.env.test

# Relancer avec plus de détails
cd saas-immo && npm test -- --verbose
```

**Health check 503 ?**
```bash
# Vérifier la connexion DB
cd saas-immo && npx prisma db pull
```

**Logs ne s'écrivent pas ?**
```bash
# Vérifier que le dossier existe
mkdir -p saas-immo/logs
```

---

## 🎯 Résultat Attendu

✅ Tests backend : 11 tests passent
✅ Tests frontend : 8 tests passent
✅ Health check : retourne 200 OK
✅ Logs : écrits dans `logs/combined.log`
✅ Sentry : capture les erreurs (si configuré)

---

**Temps total** : ~15 minutes
**Difficulté** : ⭐⭐☆☆☆ (Facile)
**Impact** : 🚀🚀🚀🚀🚀 (Énorme)

Bon courage ! 💪
