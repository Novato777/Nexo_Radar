const webpush = require('web-push');
const db = require('../db');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BOwd8e43LdIf0iLIc2PeNMDYllr9gbDe21loxlKxZ7Q_QnmU3qO4Ak4GNrLyl4nSz6kEgXLVFNVcYL83T6ThNbE';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '9TL_d0O0OQthw1Gkla_bDODtEpgH4x4ZmKqshOkDGD4';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@nexoradar.com';

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

/**
 * Enviar notificación Web Push a todos los dispositivos registrados (incluso con pantalla apagada en Android)
 */
async function sendPushNotificationToAll(payload) {
  try {
    const result = await db.query('SELECT endpoint, p256dh, auth FROM push_subscriptions');
    const subscriptions = result.rows;

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[WebPush] No hay suscripciones registradas aún');
      return;
    }

    console.log(`[WebPush] Enviando notificación a ${subscriptions.length} dispositivo(s)...`);

    const jsonPayload = JSON.stringify(payload);

    const sendPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, jsonPayload);
      } catch (err) {
        // Si el endpoint expiró o fue desinstalado por el usuario (404 / 410), eliminarlo
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[WebPush] Eliminando suscripción inactiva: ${sub.endpoint.slice(0, 35)}...`);
          await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]).catch(() => {});
        } else {
          console.warn('[WebPush] Error enviando a dispositivo:', err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    console.log('[WebPush] Difusión de notificaciones completada');
  } catch (error) {
    console.error('[WebPush] Error general enviando push notifications:', error);
  }
}

module.exports = {
  webpush,
  vapidPublicKey,
  sendPushNotificationToAll
};
