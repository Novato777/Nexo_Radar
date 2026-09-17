/**
 * Utilidad de compresión y redimensión de imágenes en el cliente (Navegador)
 * Reduce fotografías de cámaras móviles (5-10 MB) a archivos optimizados de 40-80 KB.
 * Esto asegura subidas instantáneas en redes móviles, no sobrecarga la memoria y 
 * permite persistencia indestructible en base de datos PostgreSQL y Cloudinary.
 */

export async function compressImage(file, {
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.78,
  mimeType = 'image/jpeg'
} = {}) {
  // Si no es un archivo válido o es un SVG, devolver sin modificar
  if (!file || !(file instanceof Blob)) return file;
  if (file.type === 'image/svg+xml') return file;

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (!width || !height) {
              return resolve(file);
            }

            // Calcular escala proporcional manteniendo relación de aspecto
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              return resolve(file);
            }

            // Fondo blanco en caso de imágenes transparentes convertidas a JPEG
            if (mimeType === 'image/jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  return resolve(file);
                }

                // Generar nombre de archivo con extensión adecuada
                const originalName = file.name || 'image.jpg';
                const baseName = originalName.replace(/\.[^/.]+$/, '');
                const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';
                const compressedFileName = `${baseName}${ext}`;

                const compressedFile = new File([blob], compressedFileName, {
                  type: mimeType,
                  lastModified: Date.now()
                });

                console.log(
                  `[ImageCompressor] Reducción: ${(file.size / 1024).toFixed(1)} KB ➔ ${(compressedFile.size / 1024).toFixed(1)} KB`
                );

                resolve(compressedFile);
              },
              mimeType,
              quality
            );
          } catch (canvasErr) {
            console.warn('[ImageCompressor] Error en canvas, usando archivo original:', canvasErr);
            resolve(file);
          }
        };

        img.onerror = () => {
          console.warn('[ImageCompressor] Error al decodificar imagen, usando archivo original');
          resolve(file);
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        resolve(file);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('[ImageCompressor] Excepción general:', err);
      resolve(file);
    }
  });
}
