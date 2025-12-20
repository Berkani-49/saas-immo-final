# PWA (Progressive Web App) - ImmoPro

## Fonctionnalités installées

Votre application est maintenant une **PWA complète** avec les fonctionnalités suivantes :

### 📱 Installation sur mobile/desktop
- L'application peut être installée comme une vraie app native
- Icône sur l'écran d'accueil
- Lancement en plein écran (sans barre de navigateur)
- Fonctionne sur iOS, Android, Windows, Mac, Linux

### 🔔 Notifications Push
- Notifications en temps réel
- Alertes pour nouveaux biens, rendez-vous, messages
- Fonctionne même quand l'app est fermée

### 📦 Fonctionnement hors ligne
- Cache intelligent des ressources
- L'app fonctionne même sans connexion Internet
- Synchronisation automatique quand la connexion revient

### ⚡ Performance améliorée
- Chargement ultra-rapide
- Cache des données
- Expérience fluide

## Comment installer l'application

### Sur ordinateur (Chrome/Edge)
1. Ouvrez l'application dans votre navigateur
2. Cliquez sur l'icône **+** ou **Installer** dans la barre d'adresse
3. Confirmez l'installation
4. L'app apparaît dans vos applications

### Sur mobile (iOS)
1. Ouvrez Safari
2. Tapez sur le bouton **Partager** (carré avec flèche)
3. Sélectionnez **Sur l'écran d'accueil**
4. Tapez **Ajouter**

### Sur mobile (Android)
1. Ouvrez Chrome
2. Tapez sur les **trois points** (menu)
3. Sélectionnez **Installer l'application**
4. Confirmez

## Comment activer les notifications

1. Quand vous vous connectez, une popup apparaît
2. Cliquez sur **Activer** pour autoriser les notifications
3. Les notifications fonctionneront instantanément

## Fichiers ajoutés

- `/public/manifest.json` - Configuration de l'app PWA
- `/public/sw.js` - Service Worker pour le cache et les notifications
- `/src/utils/notifications.js` - Utilitaires de gestion des notifications
- `/src/components/PWAPrompt.jsx` - UI pour l'installation et les notifications

## Technologies utilisées

- **Service Worker** - Gestion du cache et notifications
- **Web App Manifest** - Configuration PWA
- **Notification API** - Notifications push
- **Cache API** - Stockage hors ligne

## Avantages pour vos utilisateurs

✅ **Accès rapide** - Un clic depuis l'écran d'accueil
✅ **Notifications** - Ne ratez aucun rendez-vous ou nouveau bien
✅ **Hors ligne** - Consultez les données même sans Internet
✅ **Expérience native** - Comme une vraie application
✅ **Pas de stores** - Pas besoin de passer par l'App Store ou Google Play

---

**Note** : Les notifications push nécessitent HTTPS en production. Sur Render/Vercel, HTTPS est automatique.
