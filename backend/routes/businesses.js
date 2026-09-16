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

// PATCH /api/businesses/:id/logo
// Actualiza únicamente la imagen o logotipo de un negocio existente
router.patch('/:id/logo', upload.single('logo'), async (req, res) => {
  const { id } = req.params;

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'Debes adjuntar un archivo de imagen en el campo "logo".' });
  }

  try {
    const logo_url = await uploadImage(req.file.buffer, req.file.originalname, 'nexo_radar/logos');

    const result = await db.query(
      `UPDATE businesses 
       SET logo_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const updatedBusiness = result.rows[0];

    // Emitir cambio a la flota en tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('business_data_changed', { action: 'updated', business: updatedBusiness });
    }

    res.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error('[Error actualizando logo del negocio]:', error);
    res.status(500).json({ error: 'Error al actualizar el logotipo del negocio' });
  }
});

// Middleware para procesar multipart solo si se adjunta archivo, o continuar si es JSON
const optionalUploadLogo = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('logo')(req, res, (err) => {
      if (err) {
        console.error('[Error de multer al procesar formulario]:', err);
        return res.status(400).json({ error: `Error en la subida de imagen: ${err.message}` });
      }
      next();
    });
  } else {
    next();
  }
};

// Controlador unificado para PUT y PATCH /api/businesses/:id
const updateBusinessHandler = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const { business_name, owner_name, phone, city, address, latitude, longitude, qr_token } = body;

  try {
    const currentRes = await db.query('SELECT * FROM businesses WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }
    const currentBiz = currentRes.rows[0];

    // Si viene nuevo archivo de imagen para logo, subir a Cloudinary
    let logo_url = currentBiz.logo_url;
    if (req.file && req.file.buffer) {
      try {
        logo_url = await uploadImage(req.file.buffer, req.file.originalname, 'nexo_radar/logos');
      } catch (uploadErr) {
        console.error('[Error subiendo logo en edición]:', uploadErr);
      }
    }

    // Parseo seguro de coordenadas
    const parseCoord = (val, defaultVal) => {
      if (val === undefined || val === null || val === '' || val === 'null') {
        return (defaultVal !== undefined && defaultVal !== null && !isNaN(parseFloat(defaultVal)))
          ? parseFloat(defaultVal)
          : null;
      }
      const num = parseFloat(val);
      if (isNaN(num)) {
        return (defaultVal !== undefined && defaultVal !== null && !isNaN(parseFloat(defaultVal)))
          ? parseFloat(defaultVal)
          : null;
      }
      return num;
    };

    const lat = parseCoord(latitude, currentBiz.latitude);
    const lng = parseCoord(longitude, currentBiz.longitude);

    // Parseo seguro de token QR
    let finalQr = currentBiz.qr_token;
    if (qr_token !== undefined && qr_token !== null) {
      const str = String(qr_token).trim();
      finalQr = str.length > 0 ? str : currentBiz.qr_token;
    }

    const finalBusinessName = (business_name !== undefined && String(business_name).trim()) 
      ? String(business_name).trim() 
      : currentBiz.business_name;
    const finalOwnerName = owner_name !== undefined ? String(owner_name).trim() : currentBiz.owner_name;
    const finalPhone = (phone !== undefined && String(phone).trim()) 
      ? String(phone).trim() 
      : currentBiz.phone;
    const finalCity = (city !== undefined && String(city).trim()) 
      ? String(city).trim() 
      : currentBiz.city;
    const finalAddress = address !== undefined ? String(address).trim() : currentBiz.address;

    const result = await db.query(
      `UPDATE businesses 
       SET business_name = $1, 
           owner_name = $2, 
           phone = $3, 
           city = $4, 
           address = $5, 
           latitude = $6, 
           longitude = $7, 
           qr_token = $8, 
           logo_url = $9, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [
        finalBusinessName,
        finalOwnerName,
        finalPhone,
        finalCity,
        finalAddress,
        lat,
        lng,
        finalQr,
        logo_url,
        id
      ]
    );

    const updatedBusiness = result.rows[0];

    // Emitir cambio a la flota en tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('business_data_changed', { action: 'updated', business: updatedBusiness });
    }

    res.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error('[Error al actualizar comercio]:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El código QR ingresado ya está asignado a otro comercio registrado.' });
    }
    res.status(500).json({ error: error.message || 'Error al actualizar el negocio' });
  }
};

// Soportar tanto PUT como PATCH para máxima compatibilidad con clientes y proxies
router.put('/:id', optionalUploadLogo, updateBusinessHandler);
router.patch('/:id', optionalUploadLogo, updateBusinessHandler);

module.exports = router;



