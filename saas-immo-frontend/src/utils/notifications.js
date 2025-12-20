// Utilitaires pour gérer les notifications push PWA

/**
 * Vérifie si les notifications sont supportées par le navigateur
 */
export function areNotificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Vérifie le statut de la permission de notifications
 */
export function getNotificationPermission() {
  if (!areNotificationsSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Demande la permission d'envoyer des notifications
 */
export async function requestNotificationPermission() {
  if (!areNotificationsSupported()) {
    throw new Error('Les notifications ne sont pas supportées par ce navigateur');
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    throw new Error('Les notifications ont été bloquées. Veuillez les activer dans les paramètres du navigateur.');
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Enregistre le service worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker non supporté');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('✅ Service Worker enregistré:', registration.scope);

    // Vérifier les mises à jour
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 Nouvelle version du Service Worker détectée');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('✨ Nouvelle version disponible ! Rafraîchissez la page.');
          // Optionnel: Afficher un toast pour demander de rafraîchir
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('❌ Erreur enregistrement Service Worker:', error);
    throw error;
  }
}

/**
 * Envoie le token FCM au serveur
 */
export async function subscribeToPushNotifications(token, fcmToken) {
  try {
    const response = await fetch('https://saas-immo.onrender.com/api/user/subscribe-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fcmToken })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'enregistrement des notifications');
    }

    const data = await response.json();
    console.log('✅ Abonnement aux notifications push réussi');
    return data;
  } catch (error) {
    console.error('❌ Erreur abonnement notifications:', error);
    throw error;
  }
}

/**
 * Se désabonne des notifications push
 */
export async function unsubscribeFromPushNotifications(token) {
  try {
    const response = await fetch('https://saas-immo.onrender.com/api/user/unsubscribe-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la désinscription des notifications');
    }

    console.log('✅ Désabonnement des notifications push réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur désabonnement notifications:', error);
    throw error;
  }
}

/**
 * Affiche une notification locale (sans serveur)
 */
export async function showLocalNotification(title, options = {}) {
  if (!areNotificationsSupported()) {
    console.warn('Notifications non supportées');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permission de notification non accordée');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const notificationOptions = {
    body: options.body || '',
    icon: options.icon || '/logo.png',
    badge: '/logo.png',
    tag: options.tag || 'local-notification',
    data: options.data || {},
    vibrate: options.vibrate || [200, 100, 200],
    requireInteraction: options.requireInteraction || false,
    actions: options.actions || []
  };

  await registration.showNotification(title, notificationOptions);
}

/**
 * Vérifie si l'app est installée (mode standalone)
 */
export function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Détecte si l'installation est possible
 */
export function canInstallApp() {
  return !isAppInstalled();
}
