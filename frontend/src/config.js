// Configuración centralizada de API y URLs
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Devuelve la URL correcta para un logo, ya sea ruta relativa local o URL externa (Cloudinary)
 */
export const getLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE}${url}`;
};
