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
        cloudinary.config({
          cloud_name: parsed.hostname,
          api_key: decodeURIComponent(parsed.username || ''),
          api_secret: decodeURIComponent(parsed.password || ''),
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
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
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
 * Sube un buffer de imagen a Cloudinary de forma confiable mediante stream nativo.
 * Si Cloudinary no está configurado o falla, hace un fallback seguro guardando en disco local uploads/
 * @param {Buffer} buffer - Buffer del archivo en memoria (Multer memoryStorage)
 * @param {string} originalname - Nombre original del archivo para extensión
 * @param {string} folder - Carpeta de destino en Cloudinary
 * @returns {Promise<string>} - URL segura HTTPS resultante o ruta local
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
            console.error('[Cloudinary Upload Error]:', error);
            // Intentar fallback a guardado local en caso de fallo temporal del CDN
            try {
              const localUrl = saveToLocalFallback(buffer, originalname);
              return resolve(localUrl);
            } catch (localErr) {
              return reject(error);
            }
          }
          console.log('[Cloudinary] Imagen subida exitosamente:', result.secure_url);
          resolve(result.secure_url);
        }
      );

      uploadStream.on('error', (streamErr) => {
        console.error('[Cloudinary Stream Error]:', streamErr);
        try {
          const localUrl = saveToLocalFallback(buffer, originalname);
          resolve(localUrl);
        } catch (localErr) {
          reject(streamErr);
        }
      });

      // Stream nativo de Node.js, seguro y eficiente
      Readable.from(buffer).pipe(uploadStream);
    } else {
      console.warn('[Cloudinary Warning] Credenciales no detectadas. Guardando en almacenamiento local.');
      const localUrl = saveToLocalFallback(buffer, originalname);
      resolve(localUrl);
    }
  });
}

/**
 * Fallback seguro local en caso de que no haya variables de entorno de Cloudinary
 */
function saveToLocalFallback(buffer, originalname) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname) || '.png';
  const filename = `${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

module.exports = {
  cloudinary,
  initCloudinary,
  isCloudinaryConfigured,
  getCloudinaryStatus,
  uploadImage
};
