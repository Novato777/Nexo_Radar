// NeXo Radar - Service Worker para Notificaciones Push en Android y Fondo
const CACHE_NAME = 'nexo-radar-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuchar evento PUSH proveniente del backend (incluso con pantalla apagada en Android)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🚨 Nueva Alerta NeXo Radar';
  const options = {
    body: data.body || 'Un comercio requiere atención inmediata.',
    icon: data.icon || '/logo-icon-radar.png',
    badge: data.badge || '/favicon.png',
    vibrate: [300, 150, 300, 150, 500], // Patrón de vibración táctico
    data: {
      url: data.url || '/alertas',
      timestamp: Date.now()
    },
    tag: data.tag || 'nexo-alert-notification',
    renotify: true,
    requireInteraction: true // Mantiene la notificación visible en Android hasta que se interactúe
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Al hacer clic sobre la notificación en la pantalla de bloqueo o barra de estado
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/alertas';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la app o pestaña ya está abierta, traerla al frente
      for (const client of clientList) {
        if (client.url.includes(targetUrl) || client.url.includes('/alertas') || client.url.includes('/mapa')) {
          return client.focus();
        }
      }
      // Si está cerrada, abrir la ventana directamente
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
