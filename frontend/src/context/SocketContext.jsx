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

  // Reproducir alerta por voz (Text-to-Speech)
  const playChime = () => {
    try {
      if ('speechSynthesis' in window) {
        // Cancelar cualquier audio pendiente para que hable de inmediato
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance('Tienes un servicio nuevo');
        utterance.lang = 'es-ES'; // Español
        utterance.volume = 1.0; // Volumen máximo posible
        utterance.rate = 1.1; // Velocidad ligeramente rápida para dar sensación de urgencia
        utterance.pitch = 1.2; // Tono agudo (femenino)
        
        // Intentar asegurar una voz femenina si está disponible en el dispositivo
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.lang.startsWith('es') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer') || v.name.toLowerCase().includes('monica') || v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('lucia')));
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback al sonido de radar si el dispositivo no soporta síntesis de voz
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (err) {
      console.debug('Audio chime no activado por interacción previa');
    }
  };

  // Solicitar permiso para notificaciones y suscribir dispositivo a Web Push
  const requestNotificationPermission = async (fromUserGesture = false) => {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          await registerServiceWorkerAndSubscribePush();
        } else if (Notification.permission === 'default' && fromUserGesture) {
          const res = await Notification.requestPermission();
          if (res === 'granted') {
            await registerServiceWorkerAndSubscribePush();
          }
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
    axios.get(`${API_BASE}/api/requests?_t=${Date.now()}`)
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
    // Si ya está concedido el permiso, registrar el Service Worker silenciosamente
    requestNotificationPermission(false);

    // Los navegadores modernos exigen que requestPermission provenga de un gesto del usuario
    const handleFirstGesture = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission(true);
      }
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    // Polling de respaldo secundario (Socket.IO maneja el tiempo real principal)
    const pollInterval = setInterval(checkInitialNewAlerts, 25000);

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
      
      const isClient = window.location.pathname.startsWith('/qr');
      const hasAuth = !!localStorage.getItem('nexo_auth');
      
      // Solo actualizar estado visual, reproducir sonido y notificar si es administrador/colaborador
      if (hasAuth && !isClient) {
        setHasNewAlerts(true);
        setNewAlertsCount(prev => prev + 1);
        setLatestAlert(data);
        setLastSyncTimestamp(Date.now());
        playChime();
        triggerPushNotification(data);
      }
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
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
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
