# 🔔 Système d'Alertes Automatiques - Résumé Complet

## 📋 Ce qui a été créé

Vous disposez maintenant d'un **système complet d'alertes automatiques** pour votre CRM immobilier avec support **Email, SMS et Notifications Push**.

---

## ✅ Fichiers créés

### 1. **Backend**

#### `saas-immo/schema.prisma` (Modifié)
- ✅ Ajout des préférences de notifications dans le modèle `Contact` :
  - `notifyByEmail` (Boolean, par défaut `true`)
  - `notifyBySMS` (Boolean, par défaut `false`)
  - `notifyByPush` (Boolean, par défaut `false`)
  - `fcmToken` (String, pour Firebase)

- ✅ Nouveau modèle `Notification` pour l'historique :
  - Stocke toutes les notifications envoyées
  - Permet de tracer qui a reçu quoi et quand
  - Métadonnées JSON pour contexte (propertyId, matchScore, etc.)

#### `saas-immo/services/notificationService.js` (Nouveau)
Service centralisé qui gère **tous les types de notifications** :

**Fonctions principales :**
- `sendNotification()` - Envoie une notification multi-canal (Email + SMS + Push)
- `sendEmail()` - Envoi d'email via Resend
- `sendSMS()` - Envoi de SMS via Twilio
- `sendPushNotification()` - Envoi de push via Firebase

**Templates d'emails inclus :**
- `getNewPropertyMatchEmail()` - Alerte nouveau bien correspondant
- `getAppointmentReminderEmail()` - Rappel de RDV
- `getNewLeadEmail()` - Notification agent pour nouveau lead

**Exemple d'utilisation :**
```javascript
const { sendNotification, getNewPropertyMatchEmail } = require('./services/notificationService');

// Alerter un acheteur d'un nouveau bien
const { subject, body, htmlBody } = getNewPropertyMatchEmail({
  contact: { firstName: 'Marie' },
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

#### `saas-immo/routes/notifications.js` (Nouveau)
Routes API pour gérer les alertes automatiques :

**Fonctions automatiques :**
- `notifyMatchingBuyers(property, agentId)` - Déclenche les alertes quand un bien est créé
- `notifyAgentOfNewLead(contact, property)` - Alerte l'agent quand un lead arrive

**Routes API :**
- `GET /api/notifications/send-appointment-reminders` - Envoyer les rappels de RDV (CRON quotidien)
- `PUT /api/notifications/contacts/:id/preferences` - Modifier les préférences de notifications
- `GET /api/notifications/contacts/:id/notifications` - Historique des notifications d'un contact
- `POST /api/notifications/test` - Tester le système avec un contact

### 2. **Documentation**

#### `saas-immo/NOTIFICATIONS_SETUP.md` (Nouveau)
Guide complet de configuration avec :
- Instructions détaillées pour Resend (Email)
- Instructions détaillées pour Twilio (SMS)
- Instructions détaillées pour Firebase (Push)
- Exemples de configuration
- Variables d'environnement requises

---

## 🎯 Fonctionnalités du système

### 1. **Alertes Automatiques aux Acheteurs** 🏠

**Quand :** Un nouvel agent ajoute un bien dans le CRM

**Ce qui se passe :**
1. Le système recherche **tous les acheteurs** de cet agent
2. Pour chaque acheteur, il calcule un **score de compatibilité** (0-100%) basé sur :
   - **Budget** (40%) - Le prix du bien est dans la fourchette
   - **Ville** (30%) - Correspond aux villes préférées
   - **Chambres** (15%) - Nombre de chambres minimum respecté
   - **Surface** (15%) - Surface minimum respectée
3. Si le score est **≥ 50%**, l'acheteur reçoit une alerte par :
   - **Email** (si `notifyByEmail = true`)
   - **SMS** (si `notifyBySMS = true`)
   - **Push** (si `notifyByPush = true`)

**Email envoyé :**
- Sujet : "🏠 Nouveau bien à Paris - 350 000 €"
- Contenu : Photo du bien, détails, score de compatibilité, lien vers la fiche
- Design professionnel en HTML

**Avantage :** Les acheteurs sont **alertés en temps réel** des biens qui les intéressent = **réactivité maximale** !

---

### 2. **Rappels de Rendez-vous** 📅

**Quand :** Chaque jour à 9h00 (CRON job à configurer)

**Ce qui se passe :**
1. Le système cherche tous les RDV prévus **dans les 24h**
2. Envoie un email de rappel au client avec :
   - Date et heure du RDV
   - Nom de l'agent
   - Notes éventuelles

**Email envoyé :**
- Sujet : "📅 Rappel : Rendez-vous demain à 14:30"
- Contenu : Détails du RDV dans un encadré stylisé

**Avantage :** Réduit les **no-shows** (clients qui oublient leur RDV)

---

### 3. **Alertes aux Agents** 🎯

**Quand :** Un nouveau lead arrive via le formulaire public

**Ce qui se passe :**
1. L'agent reçoit immédiatement un email
2. Contenu : Nom, email, téléphone du prospect + bien concerné

**Email envoyé :**
- Sujet : "🎯 Nouveau lead : Marie Martin"
- Contenu : Coordonnées complètes + lien vers le contact dans le CRM

**Avantage :** L'agent peut **réagir immédiatement** et ne rate aucune opportunité

---

## 🔧 Configuration requise

### Services externes à configurer

| Service | Pourquoi | Coût | Statut |
|---------|----------|------|--------|
| **Resend** | Envoi d'emails | Gratuit (3000/mois) | ✅ Déjà configuré |
| **Twilio** | Envoi de SMS | ~0.08€/SMS | ⏳ À configurer |
| **Firebase** | Notifications push | Gratuit | ⏳ À configurer |

### Variables d'environnement à ajouter

**Pour SMS (Twilio) :**
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="votre_auth_token"
TWILIO_PHONE_NUMBER="+33612345678"
```

**Pour Push (Firebase) :**
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"immopro-crm",...}'
```

**Pour les liens dans les emails :**
```env
FRONTEND_URL="https://votre-frontend.vercel.app"
```

👉 **Guide complet dans `saas-immo/NOTIFICATIONS_SETUP.md`**

---

## 📊 Intégration dans le code existant

### Déclencher les alertes quand un bien est créé

Dans votre route `POST /api/properties`, ajoutez après la création :

```javascript
const { notifyMatchingBuyers } = require('./routes/notifications');

// Après la création du bien
const newProperty = await prisma.property.create({ ... });

// Déclencher les alertes automatiques
await notifyMatchingBuyers(newProperty, req.user.id);
```

### Déclencher les alertes quand un lead arrive

Dans votre route `POST /api/leads/public`, ajoutez après la création :

```javascript
const { notifyAgentOfNewLead } = require('./routes/notifications');

// Après la création du contact
const newContact = await prisma.contact.create({ ... });

// Notifier l'agent
await notifyAgentOfNewLead(newContact, property);
```

### Configurer le CRON job pour les rappels de RDV

**Option 1 : Service externe (Recommandé)**
- Utilisez [cron-job.org](https://cron-job.org) (gratuit)
- Configurez un job qui appelle `GET https://saas-immo.onrender.com/api/notifications/send-appointment-reminders`
- Fréquence : Tous les jours à 9h00

**Option 2 : Node-cron (Dans le code)**
```javascript
const cron = require('node-cron');

// Tous les jours à 9h00
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Envoi des rappels de RDV...');
  // Appeler la fonction
});
```

---

## 🎨 Interface Utilisateur (À créer)

### Page de préférences pour les contacts

Créer une page où les acheteurs peuvent gérer leurs alertes :

**Composant à créer : `NotificationPreferences.jsx`**
```jsx
import React, { useState } from 'react';
import { Switch, VStack, Text, Button } from '@chakra-ui/react';

export default function NotificationPreferences({ contactId }) {
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifyBySMS, setNotifyBySMS] = useState(false);
  const [notifyByPush, setNotifyByPush] = useState(false);

  const handleSave = async () => {
    await fetch(`/api/notifications/contacts/${contactId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyByEmail, notifyBySMS, notifyByPush })
    });
  };

  return (
    <VStack align="stretch">
      <Text fontSize="xl" fontWeight="bold">Mes préférences de notifications</Text>

      <Switch isChecked={notifyByEmail} onChange={(e) => setNotifyByEmail(e.target.checked)}>
        📧 Recevoir les alertes par email
      </Switch>

      <Switch isChecked={notifyBySMS} onChange={(e) => setNotifyBySMS(e.target.checked)}>
        📱 Recevoir les alertes par SMS
      </Switch>

      <Switch isChecked={notifyByPush} onChange={(e) => setNotifyByPush(e.target.checked)}>
        🔔 Recevoir les notifications push
      </Switch>

      <Button colorScheme="blue" onClick={handleSave}>Enregistrer</Button>
    </VStack>
  );
}
```

---

## 📈 Avantages Business

### Pour les agents immobiliers :
- ✅ **Gain de temps** : Plus besoin de chercher manuellement les acheteurs correspondants
- ✅ **Réactivité** : Les clients sont alertés instantanément
- ✅ **Professionnalisme** : Emails automatiques bien designés
- ✅ **Moins de no-shows** : Rappels automatiques des RDV
- ✅ **Traçabilité** : Historique de toutes les notifications envoyées

### Pour les acheteurs :
- ✅ **Réactivité** : Ils sont les premiers informés des nouveaux biens
- ✅ **Personnalisation** : Ne reçoivent que ce qui les intéresse
- ✅ **Multi-canal** : Email + SMS + Push selon leurs préférences
- ✅ **Pratique** : Rappels automatiques pour ne pas oublier les RDV

---

## 🚀 Prochaines étapes

### Immédiat (Aujourd'hui)
1. ✅ Schéma Prisma étendu
2. ✅ Service de notifications créé
3. ✅ Routes API créées
4. ✅ Documentation rédigée

### Court terme (Cette semaine)
5. ⏳ Créer un compte Twilio (15$ offerts)
6. ⏳ Créer un projet Firebase
7. ⏳ Ajouter les variables d'environnement sur Render
8. ⏳ Tester le système avec un vrai contact

### Moyen terme (Prochaines semaines)
9. ⏳ Intégrer `notifyMatchingBuyers()` dans la route de création de bien
10. ⏳ Intégrer `notifyAgentOfNewLead()` dans la route de capture de lead
11. ⏳ Configurer le CRON job pour les rappels de RDV
12. ⏳ Créer l'interface de préférences utilisateur
13. ⏳ Créer une page "Historique des notifications" pour les agents

---

## 🎯 Exemple de workflow complet

### Scénario : Un agent ajoute un nouvel appartement

1. **L'agent** ajoute un bien :
   - Adresse : "15 rue de Rivoli, Paris"
   - Prix : 450 000 €
   - Surface : 75 m²
   - Chambres : 2

2. **Le système** recherche automatiquement :
   - Marie : Budget 400k-500k, Ville "Paris", 2 chambres min → **Score 85%** ✅
   - Jean : Budget 200k-300k, Ville "Lyon", 3 chambres min → **Score 15%** ❌
   - Sophie : Budget 450k-550k, Ville "Paris, Lyon", 2 chambres min → **Score 100%** ✅

3. **Marie et Sophie reçoivent** :
   - Un **email** avec la photo du bien et tous les détails
   - Un **SMS** (si activé) : "Nouveau bien à Paris : 450 000€, 2 ch., 75m². Voir: [lien]"
   - Une **notification push** (si l'app mobile existe)

4. **L'agent** voit dans le CRM :
   - "2 acheteurs matchés avec ce bien (85% et 100%)"
   - Peut créer des tâches de relance automatiquement

---

## ✨ Points forts du système

1. **Automatique** : Aucune intervention manuelle requise
2. **Intelligent** : Scoring basé sur des critères multiples
3. **Multi-canal** : Email, SMS, Push
4. **Personnalisable** : Chaque contact gère ses préférences
5. **Traçable** : Historique complet dans la BDD
6. **Scalable** : Supporte des milliers de contacts
7. **Économique** : Gratuit pour les emails (3000/mois)
8. **Conforme RGPD** : Consentement géré par contact

---

## 📞 Support

**Documentation complète :** `saas-immo/NOTIFICATIONS_SETUP.md`

**Besoin d'aide ?**
- Resend : [resend.com/docs](https://resend.com/docs)
- Twilio : [twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- Firebase : [firebase.google.com/docs/cloud-messaging](https://firebase.google.com/docs/cloud-messaging)

---

**Créé avec ❤️ pour ImmoPro CRM**

*Dernière mise à jour : 2025-01-12*
