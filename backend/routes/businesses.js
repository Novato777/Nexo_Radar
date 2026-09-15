const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const { uploadImage } = require('../config/cloudinary');

// Multer en memoria para procesar buffers directamente y subirlos a Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

// POST /api/businesses
// Comercial/Colaborador registra un nuevo negocio con su QR y foto
router.post('/', upload.single('logo'), async (req, res) => {
  const { business_name, owner_name, phone, city, address, latitude, longitude, qr_token } = req.body;
  
  try {
    let logo_url = null;
    if (req.file && req.file.buffer) {
      try {
        logo_url = await uploadImage(req.file.buffer, req.file.originalname, 'nexo_radar/logos');
      } catch (uploadErr) {
        console.error('[Error subiendo logo a Cloudinary]:', uploadErr);
        // Continuar el registro aunque la imagen falle para no bloquear la operación
      }
    }
    
    const result = await db.query(
      `INSERT INTO businesses 
      (business_name, owner_name, phone, city, address, latitude, longitude, qr_token, logo_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [business_name, owner_name, phone, city, address, latitude, longitude, qr_token?.trim(), logo_url]
    );

    const newBusiness = result.rows[0];

    // Emitir cambio a la flota en tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('business_data_changed', { action: 'created', business: newBusiness });
    }

    res.status(201).json(newBusiness);
  } catch (error) {
    console.error('[Error al registrar negocio]:', error);
    if (error.code === '23505') { // Unique violation en PostgreSQL
      return res.status(409).json({ error: 'El código o token QR ya está asignado a otro comercio registrado.' });
    }
    res.status(500).json({ error: 'Error al registrar el negocio' });
  }
});

// GET /api/businesses
// Lista los negocios registrados
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM businesses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener negocios' });
  }
});

// GET /api/businesses/qr/:token
// Obtiene la info pública del negocio por su QR para el portal de clientes
router.get('/qr/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await db.query('SELECT id, business_name, owner_name, phone, city, address, logo_url, qr_token FROM businesses WHERE qr_token = $1', [token.trim()]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Terminal no activada o QR no vinculado',
        token: token.trim(),
        available: true
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar el QR' });
  }
});

// DELETE /api/businesses/:id
// Elimina un negocio y en cascada sus alertas
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM businesses WHERE id = $1', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('business_data_changed', { action: 'deleted', id });
    }

    res.json({ success: true, message: 'Negocio eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el negocio' });
  }
});

module.exports = router;

