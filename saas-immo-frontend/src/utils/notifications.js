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
 * S'abonne aux notifications push (Web Push)
 */
export async function subscribeToPushNotifications(token) {
  try {
    // 1. Récupérer la clé publique VAPID du serveur
    const vapidResponse = await fetch(`${API_URL}/api/push/vapid-public-key`);
    const { publicKey } = await vapidResponse.json();

    // 2. Obtenir le service worker
    const registration = await navigator.serviceWorker.ready;

    // 3. S'abonner aux notifications push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // 4. Envoyer l'abonnement au serveur
    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
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
 * Convertit une clé VAPID base64 en Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Se désabonne des notifications push
 */
export async function unsubscribeFromPushNotifications(token) {
  try {
    const response = await fetch(`${API_URL}/api/user/unsubscribe-push`, {
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
