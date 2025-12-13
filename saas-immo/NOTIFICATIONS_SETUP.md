# 🔔 Guide de Configuration des Notifications

Ce guide vous explique comment configurer les **alertes automatiques** par Email, SMS et Push Notifications pour votre CRM immobilier.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration Email (Resend)](#1-email-resend)
3. [Configuration SMS (Twilio)](#2-sms-twilio)
4. [Configuration Push (Firebase)](#3-push-notifications-firebase)
5. [Migration de la base de données](#4-migration-prisma)
6. [Variables d'environnement](#5-variables-denvironnement)
7. [Utilisation](#6-utilisation)

---

## Vue d'ensemble

Le système de notifications supporte **3 canaux** :

| Canal | Service | Utilisation | Coût estimé |
|-------|---------|-------------|-------------|
| 📧 **Email** | Resend | Alertes de nouveaux biens, rappels RDV | Gratuit (3000/mois), puis 0.001$/email |
| 📱 **SMS** | Twilio | Rappels urgents avant RDV | ~0.08€/SMS en France |
| 🔔 **Push** | Firebase | Notifications temps réel sur mobile | Gratuit |

---

## 1. 📧 Email (Resend)

### ✅ Déjà configuré !

Vous avez déjà une clé API Resend dans votre `.env` :

```env
RESEND_API_KEY="re_K25huwLE_6Gq2XmZXBpg94N9U2wDrohS2"
```

### Étapes pour utiliser votre propre domaine (optionnel)

1. Allez sur [resend.com](https://resend.com)
2. Connectez-vous avec votre compte
3. Allez dans **Domains** → **Add Domain**
4. Ajoutez votre domaine (ex: `immopro.fr`)
5. Configurez les DNS (MX, TXT, CNAME) chez votre hébergeur
6. Une fois vérifié, modifiez la ligne 12 de `services/notificationService.js` :

```javascript
const FROM_EMAIL = 'ImmoPro <contact@immopro.fr>'; // Votre domaine
```

**Limites gratuites Resend :**
- 3 000 emails/mois
- 100 emails/jour
- Domaine personnalisé inclus

---

## 2. 📱 SMS (Twilio)

### Étape 1 : Créer un compte Twilio

1. Allez sur [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Créez un compte gratuit (15$ de crédit offert)
3. Vérifiez votre email et votre numéro de téléphone

### Étape 2 : Obtenir vos identifiants

1. Dans le **Dashboard Twilio**, notez :
   - **Account SID** (commence par `AC...`)
   - **Auth Token** (masqué par défaut, cliquez sur "show")

2. Achetez un numéro de téléphone Twilio :
   - Allez dans **Phone Numbers** → **Buy a number**
   - Sélectionnez France (+33)
   - Choisissez "SMS" dans les capacités
   - Coût : ~1€/mois

### Étape 3 : Ajouter les variables d'environnement

Dans votre fichier `.env` :

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="votre_auth_token_secret"
TWILIO_PHONE_NUMBER="+33612345678"
```

### Étape 4 : Installer le package Twilio

```bash
cd saas-immo
npm install twilio
```

**Coûts Twilio :**
- 15$ offerts à l'inscription
- SMS France : ~0.08€/SMS
- Numéro de téléphone : ~1€/mois

---

## 3. 🔔 Push Notifications (Firebase)

### Étape 1 : Créer un projet Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez sur **Ajouter un projet**
3. Nommez-le "ImmoPro CRM"
4. Désactivez Google Analytics (pas nécessaire)

### Étape 2 : Configurer Cloud Messaging

1. Dans votre projet Firebase, allez dans **Paramètres** (⚙️) → **Paramètres du projet**
2. Onglet **Cloud Messaging**
3. Activez l'API Cloud Messaging si demandé

### Étape 3 : Générer une clé privée

1. Allez dans **Paramètres du projet** → Onglet **Comptes de service**
2. Cliquez sur **Générer une nouvelle clé privée**
3. Un fichier JSON sera téléchargé (ex: `immopro-firebase-adminsdk.json`)

### Étape 4 : Ajouter la clé à votre `.env`

Copiez le contenu du fichier JSON et minifiez-le sur une ligne, puis ajoutez :

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"immopro-crm","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

### Étape 5 : Installer Firebase Admin SDK

```bash
cd saas-immo
npm install firebase-admin
```

**Coût Firebase :** Gratuit (quota généreux pour petites/moyennes applis)

---

## 4. 🗄️ Migration Prisma

Appliquez les changements de schéma à la base de données :

```bash
cd saas-immo
npx prisma migrate dev --name add_notifications
npx prisma generate
```

Cela va créer :
- Les champs `notifyByEmail`, `notifyBySMS`, `notifyByPush`, `fcmToken` dans la table `Contact`
- La nouvelle table `Notification` pour l'historique

---

## 5. 🔐 Variables d'environnement

### Fichier `.env` complet

```env
# Base de données
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# JWT
JWT_SECRET="kE9!z$@8qLpW3jHc*R7b(GfD_2sF5aY+C(Uj-Nn_q)"

# Email (Resend)
RESEND_API_KEY="re_K25huwLE_6Gq2XmZXBpg94N9U2wDrohS2"

# SMS (Twilio) - À CONFIGURER
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="votre_auth_token"
TWILIO_PHONE_NUMBER="+33612345678"

# Push Notifications (Firebase) - À CONFIGURER
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Frontend URL (pour les liens dans les emails)
FRONTEND_URL="https://votre-frontend.vercel.app"

# Autres
NODE_OPTIONS="--dns-result-order=ipv4first"
OPENAI_API_KEY="sk-proj-..."
STRIPE_SECRET_KEY="sk_test_..."
REPLICATE_API_TOKEN="r8_..."
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,https://votre-frontend.vercel.app"
```

### Sur Render (Déploiement)

1. Allez dans votre service Render
2. **Environment** → **Add Environment Variable**
3. Ajoutez chaque variable ci-dessus

---

## 6. 📬 Utilisation

### Envoyer une notification manuelle

```javascript
const { sendNotification, getNewPropertyMatchEmail } = require('./services/notificationService');

// Exemple : Alerter un acheteur d'un nouveau bien
const { subject, body, htmlBody } = getNewPropertyMatchEmail({
  contact: { firstName: 'Marie', email: 'marie@example.com' },
  property: { address: '10 rue de la Paix', city: 'Paris', price: 350000, area: 80, bedrooms: 2, id: 123 },
  matchScore: 92
});

await sendNotification({
  contactId: 42,
  type: 'NEW_PROPERTY_MATCH',
  subject,
  body,
  htmlBody,
  metadata: { propertyId: 123, matchScore: 92 }
});
```

### Activer les alertes automatiques

Les alertes se déclenchent automatiquement quand :

1. **Nouveau bien ajouté** → Recherche des acheteurs correspondants → Email/SMS envoyé
2. **RDV dans 24h** → Email de rappel automatique
3. **Nouveau lead reçu** → Notification à l'agent par email

Ces triggers seront ajoutés dans les prochaines étapes !

---

## 📊 Tableau de bord des notifications

Vous pourrez consulter l'historique des notifications envoyées via l'API :

```javascript
// GET /api/notifications?contactId=42
// Retourne toutes les notifications envoyées à un contact
```

---

## ⚠️ Important : Conformité RGPD

Les contacts doivent **consentir** à recevoir des notifications. Par défaut :

- ✅ Email : Activé (`notifyByEmail: true`)
- ❌ SMS : Désactivé (`notifyBySMS: false`)
- ❌ Push : Désactivé (`notifyByPush: false`)

Les utilisateurs peuvent modifier leurs préférences depuis leur profil.

---

## 🎯 Prochaines étapes

1. ✅ Schéma Prisma étendu
2. ✅ Service de notifications créé
3. ⏳ Routes API pour gérer les préférences
4. ⏳ Intégration des alertes automatiques
5. ⏳ Interface utilisateur pour les préférences
6. ⏳ Tests et déploiement

---

## 🆘 Besoin d'aide ?

- **Resend** : [resend.com/docs](https://resend.com/docs)
- **Twilio** : [twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **Firebase** : [firebase.google.com/docs/cloud-messaging](https://firebase.google.com/docs/cloud-messaging)

---

Créé avec ❤️ pour ImmoPro CRM
