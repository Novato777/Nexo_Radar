import axios from 'axios';
import { API_BASE } from '../config';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra el Service Worker y suscribe el dispositivo a Web Push (para recibir alertas con pantalla apagada en Android)
 */
export async function registerServiceWorkerAndSubscribePush() {
  if (typeof window === 'undefined') return false;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Service Worker o PushManager no soportado en este navegador');
    return false;
  }

  try {
    // 1. Registrar /sw.js
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker registrado exitosamente');

    // 2. Comprobar / solicitar permiso de notificación
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('[Push] Permiso de notificaciones denegado o no otorgado:', permission);
      return false;
    }

    // 3. Obtener VAPID public key del backend
    const keyRes = await axios.get(`${API_BASE}/api/push/public-key`);
    const vapidKey = keyRes.data?.publicKey;
    if (!vapidKey) {
      console.warn('[Push] No se recibió la clave pública VAPID');
      return false;
    }

    // 4. Suscribir a PushManager
    const appServerKey = urlBase64ToUint8Array(vapidKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey
      });
    }

    // 5. Enviar la suscripción al servidor para persistirla en la base de datos
    let currentUserName = 'Colaborador';
    try {
      const u = JSON.parse(localStorage.getItem('nexo_user'));
      if (u?.name) currentUserName = u.name;
    } catch {}

    await axios.post(`${API_BASE}/api/push/subscribe`, {
      subscription: subscription.toJSON(),
      user_id: currentUserName
    });

    console.log('✅ [Push] Suscripción activa. El dispositivo recibirá alertas en pantalla bloqueada.');
    return true;
  } catch (error) {
    console.error('[Push] Error al suscribir dispositivo a Web Push:', error);
    return false;
  }
}

/**
 * Disparar una alerta de prueba al teléfono
 */
export async function sendTestPush() {
  return axios.post(`${API_BASE}/api/push/test`);
}
