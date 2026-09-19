const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

// Configuración robusta de Cloudinary
// Puede tomar CLOUDINARY_URL directamente o las variables separadas
function initCloudinary() {
  const envUrl = process.env.CLOUDINARY_URL;
  if (envUrl) {
    try {
      const cleanUrl = envUrl.replace(/^["']|["']$/g, '').trim();
      const parsed = new URL(cleanUrl);
      if (parsed.protocol === 'cloudinary:') {
        const apiKey = decodeURIComponent(parsed.username || '').replace(/[<>]/g, '').trim();
        const apiSecret = decodeURIComponent(parsed.password || '').replace(/[<>]/g, '').trim();
        const cloudName = (parsed.hostname || '').replace(/[<>]/g, '').trim();
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true
        });
      } else {
        console.error('[Cloudinary] Protocolo inválido en CLOUDINARY_URL. Debe comenzar con "cloudinary://"');
      }
    } catch (err) {
      console.error('[Cloudinary] Error parseando CLOUDINARY_URL:', err.message);
    }
  } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.replace(/[<>]/g, '').trim(),
      api_key: process.env.CLOUDINARY_API_KEY.replace(/[<>]/g, '').trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.replace(/[<>]/g, '').trim(),
      secure: true
    });
  }
}

initCloudinary();

/**
 * Determina si Cloudinary está correctamente configurado
 */
function isCloudinaryConfigured() {
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
}

/**
 * Retorna información diagnóstica segura de la configuración
 */
function getCloudinaryStatus() {
  const configured = isCloudinaryConfigured();
  const config = cloudinary.config();
  return {
    configured,
    cloud_name: configured ? config.cloud_name : null,
    api_key_set: Boolean(config.api_key),
    mode: configured ? 'cloudinary_cdn' : 'local_fallback'
  };
}

/**
 * Determina el tipo MIME del archivo a partir de su extensión o magic numbers del buffer
 */
function getMimeType(originalname, buffer) {
  const ext = (path.extname(originalname || '') || '').toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';

  if (buffer && buffer.length >= 12) {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  }
  return 'image/jpeg';
}

/**
 * Convierte un buffer de imagen en Data URI persistente para guardar directamente en PostgreSQL
 */
function bufferToDataUri(buffer, originalname) {
  const mime = getMimeType(originalname, buffer);
  const base64 = buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

/**
 * Sube un buffer de imagen a Cloudinary de forma confiable mediante stream nativo.
 * Si Cloudinary no está configurado o falla la conexión, genera un Data URI persistente
 * que se almacena directamente en la base de datos (PostgreSQL), garantizando que NUNCA
 * se pierda en reinicios o suspensiones de contenedores efímeros (Render/Vercel).
 * @param {Buffer} buffer - Buffer del archivo en memoria (Multer memoryStorage)
 * @param {string} originalname - Nombre original del archivo para extensión
 * @param {string} folder - Carpeta de destino en Cloudinary
 * @returns {Promise<string>} - URL HTTPS de Cloudinary o Data URI persistente
 */
function uploadImage(buffer, originalname = 'logo.png', folder = 'nexo_radar/logos') {
  return new Promise((resolve, reject) => {
    if (!buffer || buffer.length === 0) {
      return resolve(null);
    }

    if (isCloudinaryConfigured()) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]:', error.message || error);
            // Fallback indestructible a Data URI persistente en PostgreSQL
            try {
              const persistentUri = bufferToDataUri(buffer, originalname);
              console.log('[Cloudinary Fallback] Imagen guardada en Data URI persistente para PostgreSQL');
              return resolve(persistentUri);
            } catch (localErr) {
              return reject(error);
            }
          }
          console.log('[Cloudinary] Imagen subida exitosamente:', result.secure_url);
          resolve(result.secure_url);
        }
      );

      uploadStream.on('error', (streamErr) => {
        console.error('[Cloudinary Stream Error]:', streamErr.message || streamErr);
        try {
          const persistentUri = bufferToDataUri(buffer, originalname);
          resolve(persistentUri);
        } catch (localErr) {
          reject(streamErr);
        }
      });

      // Stream nativo de Node.js, seguro y eficiente
      Readable.from(buffer).pipe(uploadStream);
    } else {
      console.warn('[Cloudinary Warning] Credenciales no detectadas. Guardando en base de datos como Data URI permanente.');
      try {
        const persistentUri = bufferToDataUri(buffer, originalname);
        resolve(persistentUri);
      } catch (e) {
        console.error('[Data URI Conversion Error]:', e.message);
        resolve(null);
      }
    }
  });
}

module.exports = {
  cloudinary,
  initCloudinary,
  isCloudinaryConfigured,
  getCloudinaryStatus,
  uploadImage,
  bufferToDataUri,
  getMimeType
};

