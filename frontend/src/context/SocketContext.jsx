import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

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

  // Solicitar permiso para notificaciones web en PC y móviles
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.debug('Error solicitando permisos de notificación:', err);
      }
    }
  };

  // Disparar notificación push del sistema operativo (Android y Windows/Mac)
  const triggerPushNotification = (alertData) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const title = `🚨 Alerta en NeXo Radar: ${alertData.business_name || 'Comercio'}`;
    const options = {
      body: `[${alertData.type || 'Atención'}]: ${alertData.message || 'Señal recibida desde terminal QR'}`,
      icon: alertData.logo_url ? `${API_BASE}${alertData.logo_url}` : undefined,
      tag: `nexo-alert-${alertData.id}`,
      renotify: true
    };

    try {
      const n = new Notification(title, options);
      n.onclick = () => {
        window.focus();
        window.location.href = '/alertas';
      };
    } catch (err) {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options));
      }
    }
  };

  // Consultar si existen alertas NUEVAS para el punto amarillo en el navbar
  const checkInitialNewAlerts = React.useCallback(() => {
    axios.get(`${API_BASE}/api/requests`)
      .then(res => {
        const newOnes = res.data.filter(r => (r.status || '').toUpperCase() === 'NUEVA' || (r.status || '').toUpperCase() === 'PENDIENTE');
        if (newOnes.length > 0) {
          setHasNewAlerts(true);
          setNewAlertsCount(newOnes.length);
        } else {
          setHasNewAlerts(false);
          setNewAlertsCount(0);
        }
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
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Conectado a la red NeXo en tiempo real');
      checkInitialNewAlerts();
    });

    // Escuchar nuevas solicitudes emitidas desde cualquier QR
    newSocket.on('new_request', (data) => {
      console.log('[Socket.IO] ¡Nueva solicitud recibida en tiempo real!:', data);
      setHasNewAlerts(true);
      setNewAlertsCount(prev => prev + 1);
      setLatestAlert(data);
      playChime();
      triggerPushNotification(data);
    });

    newSocket.on('request_updated', (updated) => {
      console.log('[Socket.IO] Solicitud actualizada:', updated);
      checkInitialNewAlerts();
    });

    setSocket(newSocket);

    return () => {
      clearInterval(pollInterval);
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
      requestNotificationPermission 
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
