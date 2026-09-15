const cloudinary = require('cloudinary').v2;
const streamifier = require('stream');
const fs = require('fs');
const path = require('path');

// Configuración automática de Cloudinary
// Puede tomar CLOUDINARY_URL directamente o las variables separadas
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Determina si Cloudinary está correctamente configurado
 */
function isCloudinaryConfigured() {
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
}

/**
 * Sube un buffer de imagen a Cloudinary de forma confiable mediante stream.
 * Si Cloudinary no está configurado, hace un fallback seguro guardando en disco local uploads/
 * @param {Buffer} buffer - Buffer del archivo en memoria (Multer memoryStorage)
 * @param {string} originalname - Nombre original del archivo para extensión
 * @param {string} folder - Carpeta de destino en Cloudinary
 * @returns {Promise<string>} - URL segura HTTPS resultante
 */
function uploadImage(buffer, originalname = 'logo.png', folder = 'nexo_radar/logos') {
  return new Promise((resolve, reject) => {
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

      const readableStream = new streamifier.Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
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
  isCloudinaryConfigured,
  uploadImage
};
