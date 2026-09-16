import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE, getLogoUrl } from '../config';
import { registerServiceWorkerAndSubscribePush, sendTestPush } from '../utils/pushNotifications';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [hasNewAlerts, setHasNewAlerts] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const [latestAlert, setLatestAlert] = useState(null);
  const audioContextRef = useRef(null);

  // Reproducir un tono suave y profesional sin depender de archivos de audio externos
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Doble tono suave tipo sonar/radar
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // Re 5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // La 5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // Re 6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (err) {
      console.debug('Audio chime no activado por interacción previa');
    }
  };

  // Solicitar permiso para notificaciones y suscribir dispositivo a Web Push
  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
          await registerServiceWorkerAndSubscribePush();
        }
      }
    } catch (err) {
      console.debug('Error configurando notificaciones Web Push:', err);
    }
  };

  // Disparar notificación visual del sistema operativo (Android y Escritorio)
  const triggerPushNotification = (alertData) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const title = `🚨 Alerta NeXo: ${alertData.business_name || 'Comercio'}`;
    const options = {
      body: `[${alertData.type || 'Atención'}]: ${alertData.message || 'Señal recibida desde terminal QR'}`,
      icon: alertData.logo_url ? getLogoUrl(alertData.logo_url) : '/logo-icon-radar.png',
      badge: '/favicon.png',
      tag: `nexo-alert-${alertData.id || Date.now()}`,
      renotify: true,
      data: { url: '/alertas' },
      vibrate: [300, 150, 300, 150, 500]
    };

    // En Android Chrome, new Notification() en contexto de ventana lanza error. Se debe usar ServiceWorkerRegistration.showNotification()
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then(reg => reg.showNotification(title, options))
        .catch(() => {
          try {
            const n = new Notification(title, options);
            n.onclick = () => { window.focus(); window.location.href = '/alertas'; };
          } catch {}
        });
    } else {
      try {
        const n = new Notification(title, options);
        n.onclick = () => { window.focus(); window.location.href = '/alertas'; };
      } catch {}
    }
  };

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(Date.now());

  // Consultar si existen alertas NUEVAS para el punto amarillo en el navbar
  const checkInitialNewAlerts = React.useCallback(() => {
    axios.get(`${API_BASE}/api/requests?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        const newOnes = list.filter(r => (r.status || '').toUpperCase() === 'NUEVA' || (r.status || '').toUpperCase() === 'PENDIENTE');
        if (newOnes.length > 0) {
          setHasNewAlerts(true);
          setNewAlertsCount(newOnes.length);
        } else {
          setHasNewAlerts(false);
          setNewAlertsCount(0);
        }
        setLastSyncTimestamp(Date.now());
      })
      .catch(err => console.debug('Error comprobando alertas iniciales', err));
  }, []);

  useEffect(() => {
    checkInitialNewAlerts();
    requestNotificationPermission();

    // Polling de respaldo cada 6 segundos para garantizar sincronización de la campanita
    const pollInterval = setInterval(checkInitialNewAlerts, 6000);

    // Inicializar conexión Socket.IO con el backend
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1500
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Conectado a la red NeXo en tiempo real');
      checkInitialNewAlerts();
    });

    newSocket.on('reconnect', () => {
      console.log('[Socket.IO] Reconectado a la red NeXo');
      checkInitialNewAlerts();
    });

    // Escuchar nuevas solicitudes emitidas desde cualquier QR
    newSocket.on('new_request', (data) => {
      console.log('[Socket.IO] ¡Nueva solicitud recibida en tiempo real!:', data);
      setHasNewAlerts(true);
      setNewAlertsCount(prev => prev + 1);
      setLatestAlert(data);
      setLastSyncTimestamp(Date.now());
      playChime();
      triggerPushNotification(data);
    });

    newSocket.on('request_updated', (updated) => {
      console.log('[Socket.IO] Solicitud actualizada:', updated);
      checkInitialNewAlerts();
    });

    // Control de despertar y recuperación desde bfcache en Android / móviles
    const handleAppWakeUp = () => {
      if (document.visibilityState === 'visible' || !document.hidden) {
        if (newSocket && !newSocket.connected) {
          newSocket.connect();
        }
        checkInitialNewAlerts();
      }
    };

    document.addEventListener('visibilitychange', handleAppWakeUp);
    window.addEventListener('pageshow', handleAppWakeUp);
    window.addEventListener('focus', handleAppWakeUp);

    setSocket(newSocket);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleAppWakeUp);
      window.removeEventListener('pageshow', handleAppWakeUp);
      window.removeEventListener('focus', handleAppWakeUp);
      newSocket.disconnect();
    };
  }, [checkInitialNewAlerts]);

  const clearNewAlertsDot = React.useCallback(() => {
    setHasNewAlerts(false);
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      hasNewAlerts, 
      newAlertsCount, 
      clearNewAlertsDot, 
      latestAlert, 
      lastSyncTimestamp,
      checkInitialNewAlerts,
      requestNotificationPermission,
      subscribeToPushNotifications: registerServiceWorkerAndSubscribePush,
      sendTestPush
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
