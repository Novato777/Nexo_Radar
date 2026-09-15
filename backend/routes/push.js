const express = require('express');
const router = express.Router();
const db = require('../db');
const { vapidPublicKey, sendPushNotificationToAll } = require('../config/webpush');

// GET /api/push/public-key
router.get('/public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
  const { subscription, user_id } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  try {
    await db.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE 
       SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_id = EXCLUDED.user_id`,
      [endpoint, p256dh, auth, user_id || null]
    );

    console.log(`[WebPush] Dispositivo suscrito exitosamente (Endpoint: ${endpoint.slice(0, 35)}...)`);
    res.status(201).json({ success: true, message: 'Dispositivo registrado para alertas push' });
  } catch (error) {
    console.error('[WebPush] Error guardando suscripción:', error);
    res.status(500).json({ error: 'Error registrando suscripción' });
  }
});

// POST /api/push/test (Para probar que vibre y suene en el teléfono)
router.post('/test', async (req, res) => {
  try {
    await sendPushNotificationToAll({
      title: '🚨 Prueba de Alerta NeXo Radar',
      body: '¡Excelente! Las notificaciones con pantalla apagada en Android están funcionando.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      url: '/alertas',
      tag: 'nexo-test-alert'
    });
    res.json({ success: true, message: 'Alerta de prueba enviada a los dispositivos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
