import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Intervalo de Ping: 10 minutos (600.000 ms) para anticiparse a los 15 min de suspensión de Render
const PING_INTERVAL_MS = 10 * 60 * 1000; 

// Tiempo límite de inactividad antes de auto-cerrar sesión (45 minutos para trabajo cómodo en campo móvil)
const DEFAULT_INACTIVITY_TIMEOUT_MS = 45 * 60 * 1000; 

// Throttling de registro de actividad para proteger el rendimiento (máximo cada 5 segundos)
const ACTIVITY_THROTTLE_MS = 5 * 1000; 

// Intervalo periódico de chequeo de expiración (cada 15 segundos)
const CHECK_INTERVAL_MS = 15 * 1000;

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Hook de Keep-Alive Inteligente Basado en Sesión y Actividad
 * Mantiene despierto el backend en Render MIENTRAS haya un usuario con sesión activa
 * y suspende automáticamente los pings al cerrar pestaña o superar el tiempo de inactividad.
 */
export default function useKeepAlive({
  timeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS,
  pingIntervalMs = PING_INTERVAL_MS,
  onSessionExpired
} = {}) {
  const navigate = useNavigate();
  const lastThrottleRef = useRef(0);

  useEffect(() => {
    // 1. Validar si el usuario cuenta con sesión/token activo
    const token = localStorage.getItem('nexo_auth');
    if (!token) return;

    // Inicializar timestamp de última actividad si no existiera
    const nowInit = Date.now().toString();
    if (!localStorage.getItem('app_last_activity')) {
      localStorage.setItem('app_last_activity', nowInit);
      localStorage.setItem('nexo_last_activity', nowInit);
    }

    // Rutina de desconexión segura
    const handleLogout = (reason = 'inactivity') => {
      localStorage.removeItem('nexo_auth');
      localStorage.removeItem('nexo_user');
      localStorage.removeItem('app_last_activity');
      localStorage.removeItem('nexo_last_activity');

      if (typeof onSessionExpired === 'function') {
        onSessionExpired(reason);
      }

      navigate('/login');
    };

    // 2. Ping ultra-rápido y silencioso al endpoint de salud
    const triggerPing = async () => {
      // Doble verificación: solo disparar si la sesión sigue existiendo
      if (!localStorage.getItem('nexo_auth')) return;

      try {
        await axios.get(`${API_BASE}/api/health`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          timeout: 8000
        });
      } catch (err) {
        // Silenciamiento estricto por requerimiento: no contaminar consola ni interrumpir al usuario
      }
    };

    // 3. Listener de actividad global con Throttling a 5 segundos
    const recordUserActivity = () => {
      // No actualizar actividad si no hay sesión activa
      if (!localStorage.getItem('nexo_auth')) return;

      const now = Date.now();
      if (now - lastThrottleRef.current >= ACTIVITY_THROTTLE_MS) {
        lastThrottleRef.current = now;
        const nowStr = now.toString();
        localStorage.setItem('app_last_activity', nowStr);
        localStorage.setItem('nexo_last_activity', nowStr);
      }
    };

    // 4. Verificación de inactividad
    const evaluateInactivity = () => {
      const currentToken = localStorage.getItem('nexo_auth');
      if (!currentToken) {
        handleLogout('no_token');
        return;
      }

      const storedTime = localStorage.getItem('app_last_activity') || localStorage.getItem('nexo_last_activity');
      const lastActivity = parseInt(storedTime || '0', 10);
      
      const configTimeout = localStorage.getItem('nexo_session_timeout');
      const activeTimeoutMs = configTimeout !== null ? parseInt(configTimeout, 10) : timeoutMs;
      
      // Si configuraron "0" (Sesión Permanente), evadimos la desconexión
      if (activeTimeoutMs === 0) return;

      if (lastActivity && Date.now() - lastActivity > activeTimeoutMs) {
        handleLogout('timeout');
      }
    };

    // 5. Configurar Ping periódico (cada 10 minutos) y un ping inicial de calentamiento
    const initialWarmupTimer = setTimeout(triggerPing, 1000);
    const pingTimer = setInterval(triggerPing, pingIntervalMs);

    // 6. Configurar temporizador de expiración periódico (cada 10 segundos)
    const checkTimer = setInterval(evaluateInactivity, CHECK_INTERVAL_MS);

    // 7. Registrar escuchadores de eventos globales de actividad
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, recordUserActivity, { passive: true });
    });

    // 8. Control de visibilidad de pestaña (cuando vuelve del segundo plano)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        evaluateInactivity();
        recordUserActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 9. Guardar última actividad al cerrar o descargar pestaña
    const handlePageUnload = () => {
      const nowStr = Date.now().toString();
      localStorage.setItem('app_last_activity', nowStr);
      localStorage.setItem('nexo_last_activity', nowStr);
    };
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    // 10. Sincronización multi-pestaña (si se cierra sesión en otra ventana)
    const handleStorageSync = (e) => {
      if (e.key === 'nexo_auth' && !e.newValue) {
        handleLogout('multi_tab_logout');
      }
    };
    window.addEventListener('storage', handleStorageSync);

    // Limpieza exhaustiva al desmontarse: detiene de inmediato los pings e intervalos
    return () => {
      clearTimeout(initialWarmupTimer);
      clearInterval(pingTimer);
      clearInterval(checkTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [navigate, timeoutMs, pingIntervalMs, onSessionExpired]);
}
