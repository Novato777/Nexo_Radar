const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendPushNotificationToAll } = require('../config/webpush');

// POST /api/requests
// Cliente manda una señal/solicitud desde su perfil público
router.post('/', async (req, res) => {
  const { business_id, type, message } = req.body;
  
  try {
    const result = await db.query(
      `INSERT INTO service_requests (business_id, type, message) 
      VALUES ($1, $2, $3) RETURNING *`,
      [business_id, type, message]
    );

    const newRequest = result.rows[0];

    // Obtener los datos completos del comercio para emitir en tiempo real
    const fullDataResult = await db.query(`
      SELECT r.*, b.business_name, b.city, b.phone, b.logo_url 
      FROM service_requests r 
      JOIN businesses b ON r.business_id = b.id 
      WHERE r.id = $1
    `, [newRequest.id]);

    const fullRequest = fullDataResult.rows[0] || newRequest;

    // Emisión en tiempo real vía WebSockets a clientes activos
    const io = req.app.get('io');
    if (io) {
      io.emit('new_request', fullRequest);
    }

    // Difusión Web Push a teléfonos Android (incluso con pantalla apagada o app cerrada)
    sendPushNotificationToAll({
      title: `🚨 Alerta NeXo: ${fullRequest.business_name || 'Comercio'}`,
      body: `[${fullRequest.type || 'Servicio'}]: ${fullRequest.message || 'Señal recibida desde terminal QR'}`,
      icon: fullRequest.logo_url || '/favicon.png',
      badge: '/favicon.png',
      url: `/alertas`,
      tag: `nexo-alert-${fullRequest.id}`
    }).catch(err => console.debug('[WebPush send error]:', err.message));

    res.status(201).json(fullRequest);
  } catch (error) {
    console.error('[Error al crear solicitud]:', error);
    res.status(500).json({ error: 'Error al enviar la solicitud' });
  }
});

// GET /api/requests
// Panel de NeXo: Lista todas las solicitudes para ser atendidas
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, b.business_name, b.city, b.phone, b.logo_url 
      FROM service_requests r 
      JOIN businesses b ON r.business_id = b.id 
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('[Error al obtener solicitudes]:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// PATCH /api/requests/:id
// Actualizar estado de una alerta específica (NUEVA, EN PROCESO, RESUELTA)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, attended_by, resolved_by } = req.body;
  try {
    const resolvedAt = status === 'RESUELTA' ? new Date() : null;
    const viewedAt = status === 'EN PROCESO' ? new Date() : null;
    
    await db.query(
      `UPDATE service_requests 
       SET status = $1, 
           resolved_at = COALESCE($2, resolved_at),
           viewed_at = COALESCE($3, viewed_at),
           attended_by = COALESCE($4, attended_by),
           resolved_by = COALESCE($5, resolved_by)
       WHERE id = $6`,
      [status, resolvedAt, viewedAt, attended_by || null, resolved_by || null, id]
    );
    
    const result = await db.query(
      `SELECT r.*, b.business_name, b.city, b.phone, b.logo_url 
       FROM service_requests r 
       JOIN businesses b ON r.business_id = b.id 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    const updated = result.rows[0];

    // Emitir cambio de estado en tiempo real para esa alerta específica
    const io = req.app.get('io');
    if (io) {
      io.emit('request_updated', updated);
    }

    res.json(updated);
  } catch (error) {
    console.error('[Error actualizando alerta]:', error);
    res.status(500).json({ error: 'Error al actualizar estado de la solicitud' });
  }
});

module.exports = router;

