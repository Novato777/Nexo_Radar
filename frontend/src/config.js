// Configuración centralizada de API y URLs
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Devuelve la URL correcta para un logo, ya sea ruta relativa local o URL externa (Cloudinary)
 */
export const getLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const cleanBase = (API_BASE || '').replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
};

/**
 * Genera el enlace directo a WhatsApp optimizado para PC y móviles.
 * Evita la página intermedia wa.me que corrompe emojis en computadoras.
 */
export const buildWhatsAppUrl = (phone, text) => {
  if (!phone) return null;
  const cleanPhone = phone.toString().replace(/\D/g, '');
  if (!cleanPhone) return null;
  const formattedPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  
  // En móviles abre la app directamente vía api.whatsapp.com; en PC abre WhatsApp Web directo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const baseUrl = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  
  return `${baseUrl}?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
};

/**
 * Mensaje enriquecido con emojis y saltos de línea para alertas RESUELTAS
 */
export const getResolvedWhatsAppMessage = (businessName) => {
  const name = businessName ? businessName.trim() : 'Comercio';
  return `¡Hola *${name}*! 👋✨\n\n` +
         `Muchas gracias por preferirnos, valoramos mucho tu confianza. 🤝\n\n` +
         `Tu solicitud de atención ha sido atendida y marcada como *RESUELTA* con éxito. ✅\n\n` +
         `Si requieres asistencia técnica adicional, soporte en tu terminal o tienes nuevas inquietudes, no dudes en escribirnos por este medio. 💬\n\n` +
         `¡Con aprecio, el equipo de *NeXo Radar*! 🚀📡`;
};

/**
 * Mensaje inicial de contacto de la central operativa
 */
export const getContactWhatsAppMessage = (businessName) => {
  const name = businessName ? businessName.trim() : 'Comercio';
  return `¡Hola *${name}*! 👋✨\n\n` +
         `Nos comunicamos desde la central operativa de *NeXo Radar* respecto a tu requerimiento de atención. 🛡️\n\n` +
         `¿En qué podemos colaborarte en este momento? 💬`;
};

