import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Bell, BellRing, ArrowLeft, Loader2, Phone, MapPin, 
  Clock, CheckCircle2, AlertTriangle, RefreshCw, MessageCircle, 
  ExternalLink, Search, X, Check, Radio, Filter, Building2, ShieldAlert,
  Layers, ChevronRight, Smartphone, Volume2 
} from 'lucide-react';
import Modal from '../components/Modal';
import { useSocket } from '../context/SocketContext';
import { API_BASE, getLogoUrl, buildWhatsAppUrl, getResolvedWhatsAppMessage, getContactWhatsAppMessage } from '../config';

export default function AlertCenter() {
  const navigate = useNavigate();
  const { socket, subscribeToPushNotifications, sendTestPush, lastSyncTimestamp } = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'NUEVA' | 'EN PROCESO' | 'RESUELTA'
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Estados para Web Push en Android (pantalla apagada / bloqueada)
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  });
  const [pushBannerMsg, setPushBannerMsg] = useState('');

  const handleActivatePush = async () => {
    setIsSubscribingPush(true);
    if (subscribeToPushNotifications) {
      const ok = await subscribeToPushNotifications();
      if (ok) {
        setPushStatus('granted');
        setPushBannerMsg('✅ ¡Alertas con pantalla apagada activadas con éxito en este teléfono!');
      } else {
        setPushBannerMsg('⚠️ Por favor autoriza los permisos de notificación en tu teléfono/navegador.');
      }
    }
    setIsSubscribingPush(false);
    setTimeout(() => setPushBannerMsg(''), 6000);
  };

  const handleTestNotification = async () => {
    setIsTestingPush(true);
    setPushBannerMsg('📲 Enviando alerta de prueba... Bloquea tu pantalla ahora para probar.');
    try {
      if (sendTestPush) {
        await sendTestPush();
      }
    } catch (err) {
      setPushBannerMsg('Error enviando prueba: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsTestingPush(false);
      setTimeout(() => setPushBannerMsg(''), 8000);
    }
  };

  const fetchRequests = (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    axios.get(`${API_BASE}/api/requests?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(response => {
        const data = Array.isArray(response.data) ? response.data : [];
        setRequests(data);
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(error => {
        console.error('Error fetching requests:', error);
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchRequests();
    // Intervalo de respaldo activo
    const interval = setInterval(() => fetchRequests(false), 10000);

    // Detección de regreso a la pestaña, desbloqueo de pantalla y bfcache en móviles
    const handleWakeUp = () => {
      if (document.visibilityState === 'visible' || !document.hidden) {
        fetchRequests(false);
      }
    };

    document.addEventListener('visibilitychange', handleWakeUp);
    window.addEventListener('pageshow', handleWakeUp);
    window.addEventListener('focus', handleWakeUp);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWakeUp);
      window.removeEventListener('pageshow', handleWakeUp);
      window.removeEventListener('focus', handleWakeUp);
    };
  }, []);

  // Reaccionar a sincronizaciones globales de SocketContext
  useEffect(() => {
    if (lastSyncTimestamp) {
      fetchRequests(false);
    }
  }, [lastSyncTimestamp]);

  // Sincronización en tiempo real vía Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (newReq) => {
      setRequests(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return [newReq, ...arr.filter(r => r.id !== newReq.id)];
      });
      // Sincronización secundaria inmediata para recalcular contadores y validar consistencia
      fetchRequests(false);
    };

    const handleRequestUpdated = (updatedReq) => {
      setRequests(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map(r => r.id === updatedReq.id ? { ...r, ...updatedReq } : r);
      });
    };

    const handleSocketReconnect = () => {
      fetchRequests(false);
    };

    socket.on('new_request', handleNewRequest);
    socket.on('request_updated', handleRequestUpdated);
    socket.on('connect', handleSocketReconnect);
    socket.on('reconnect', handleSocketReconnect);

    return () => {
      socket.off('new_request', handleNewRequest);
      socket.off('request_updated', handleRequestUpdated);
      socket.off('connect', handleSocketReconnect);
      socket.off('reconnect', handleSocketReconnect);
    };
  }, [socket]);

  const updateStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    setUpdatingId(id);

    // Si es RESUELTA, abrir de inmediato WhatsApp sincrónicamente para evitar que el navegador bloquee la pestaña
    let waWindow = null;
    if (newStatus === 'RESUELTA') {
      const targetReq = requests.find(r => r.id === id);
      if (targetReq && targetReq.phone) {
        const msg = getResolvedWhatsAppMessage(targetReq.business_name);
        const waUrl = buildWhatsAppUrl(targetReq.phone, msg);
        if (waUrl) {
          waWindow = window.open(waUrl, '_blank');
        }
      }
    }

    const currentUserName = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('nexo_user'));
        return u?.name || 'Colaborador';
      } catch {
        return 'Colaborador';
      }
    })();

    try {
      const payload = { 
        status: newStatus,
        attended_by: newStatus === 'EN PROCESO' ? currentUserName : undefined,
        resolved_by: newStatus === 'RESUELTA' ? currentUserName : undefined
      };

      await axios.patch(`${API_BASE}/api/requests/${id}`, payload);
      // Actualización optimista del estado local
      setRequests(prev => prev.map(req => req.id === id ? { 
        ...req, 
        status: newStatus,
        attended_by: newStatus === 'EN PROCESO' ? (req.attended_by || currentUserName) : req.attended_by,
        resolved_by: newStatus === 'RESUELTA' ? currentUserName : req.resolved_by
      } : req));
    } catch (err) {
      console.error('Error actualizando estado:', err);
      if (waWindow) waWindow.close();
      alert('No se pudo actualizar el estado de la alerta.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    let relative = '';
    if (diffMins < 1) relative = 'Hace un momento';
    else if (diffMins < 60) relative = `Hace ${diffMins} min`;
    else if (diffHours < 24) relative = `Hace ${diffHours} h`;
    else relative = date.toLocaleDateString();

    return `${relative} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Limpiar teléfono para link de WhatsApp con mensaje pre-escrito profesional
  const getWhatsAppLink = (phone, businessName) => {
    if (!phone) return null;
    const msg = getContactWhatsAppMessage(businessName);
    return buildWhatsAppUrl(phone, msg);
  };

  // Contadores de métricas
  const totalCount = requests.length;
  const newCount = requests.filter(r => (r.status || 'NUEVA').toUpperCase() === 'NUEVA' || (r.status || '').toUpperCase() === 'PENDIENTE').length;
  const inProgressCount = requests.filter(r => (r.status || '').toUpperCase() === 'EN PROCESO').length;
  const resolvedCount = requests.filter(r => (r.status || '').toUpperCase() === 'RESUELTA' || (r.status || '').toUpperCase() === 'ATENDIDA').length;

  // Filtrado de solicitudes
  const filteredRequests = requests.filter(req => {
    const status = (req.status || 'NUEVA').toUpperCase();
    if (activeFilter === 'NUEVA' && status !== 'NUEVA' && status !== 'PENDIENTE') return false;
    if (activeFilter === 'EN PROCESO' && status !== 'EN PROCESO') return false;
    if (activeFilter === 'RESUELTA' && status !== 'RESUELTA' && status !== 'ATENDIDA') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (req.business_name || '').toLowerCase().includes(q);
      const matchCity = (req.city || '').toLowerCase().includes(q);
      const matchMsg = (req.message || '').toLowerCase().includes(q);
      const matchType = (req.type || '').toLowerCase().includes(q);
      const matchPhone = (req.phone || '').toLowerCase().includes(q);
      return matchName || matchCity || matchMsg || matchType || matchPhone;
    }
    return true;
  });

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ENCABEZADO */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: newCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)', border: newCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.25)', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
              <span className={newCount > 0 ? 'alert-dot-pulse-red' : 'radar-dot-pulse'} style={{ width: '8px', height: '8px', borderRadius: '50%', background: newCount > 0 ? '#ef4444' : '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: newCount > 0 ? '#ef4444' : 'var(--color-accent)', fontWeight: '700', letterSpacing: '0.08em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                {newCount > 0 ? `${newCount} SEÑAL${newCount !== 1 ? 'ES' : ''} PENDIENTE${newCount !== 1 ? 'S' : ''}` : 'SISTEMA SIN ALERTAS CRÍTICAS'}
              </span>
            </div>
            <h1 className="text-gradient" style={{ margin: '0 0 6px 0', fontSize: '2.4rem', fontWeight: '800', lineHeight: '1.2' }}>
              Centro de Alertas & Soporte
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '650px' }}>
              Monitoreo y despacho de llamadas de clientes generadas al escanear los códigos QR de sus terminales.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              onClick={pushStatus === 'granted' ? handleTestNotification : handleActivatePush}
              disabled={isTestingPush || isSubscribingPush}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: '650',
                borderColor: pushStatus === 'granted' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                background: pushStatus === 'granted' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                color: pushStatus === 'granted' ? '#10b981' : '#f59e0b'
              }}
              title={pushStatus === 'granted' ? "Enviar alerta de prueba para probar con pantalla apagada en Android" : "Activar alertas con pantalla apagada en Android"}
            >
              <Smartphone size={16} className={isTestingPush || isSubscribingPush ? 'animate-spin' : ''} />
              <span>
                {isSubscribingPush 
                  ? 'Activando...' 
                  : isTestingPush 
                    ? 'Enviando Alerta...' 
                    : pushStatus === 'granted' 
                      ? 'Probar Alerta en Celular' 
                      : 'Activar Alertas de Bloqueo'}
              </span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => fetchRequests(true)}
              disabled={isRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '600' }}
              title="Actualizar ahora"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Banner de Estado de Notificaciones Push */}
        {pushBannerMsg && (
          <div style={{
            background: pushBannerMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${pushBannerMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            color: pushBannerMsg.startsWith('✅') ? '#10b981' : '#f59e0b',
            fontSize: '0.88rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <span>{pushBannerMsg}</span>
            <button onClick={() => setPushBannerMsg('')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* BARRA DE MÉTRICAS / KPIS (RESPONSIVA EN 2 COLUMNAS EN MÓVIL) */}
        <div className="alert-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {/* Total */}
          <div 
            onClick={() => setActiveFilter('ALL')}
            className={`kpi-card kpi-card-all ${activeFilter === 'ALL' ? 'active' : ''}`}
            style={{ 
              borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Todas</span>
              <Bell size={18} color="var(--color-text-secondary)" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{totalCount}</div>
          </div>

          {/* Nuevas */}
          <div 
            onClick={() => setActiveFilter('NUEVA')}
            className={`kpi-card kpi-card-new ${activeFilter === 'NUEVA' ? 'active' : ''}`}
            style={{ 
              borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Nuevas</span>
              <ShieldAlert size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {newCount}
              {newCount > 0 && (
                <span className="alert-dot-pulse-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              )}
            </div>
          </div>

          {/* En Proceso */}
          <div 
            onClick={() => setActiveFilter('EN PROCESO')}
            className={`kpi-card kpi-card-progress ${activeFilter === 'EN PROCESO' ? 'active' : ''}`}
            style={{ 
              borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>En Proceso</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#f59e0b' }}>{inProgressCount}</div>
          </div>

          {/* Resueltas */}
          <div 
            onClick={() => setActiveFilter('RESUELTA')}
            className={`kpi-card kpi-card-resolved ${activeFilter === 'RESUELTA' ? 'active' : ''}`}
            style={{ 
              borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Resueltas</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#10b981' }}>{resolvedCount}</div>
          </div>
        </div>

        {/* BARRA DE FILTROS & BÚSQUEDA */}
        <div className="alert-controls-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', padding: '12px 16px', borderRadius: '16px' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '440px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por comercio, ciudad o mensaje..."
              style={{ paddingLeft: '42px', paddingRight: searchQuery ? '36px' : '14px', height: '42px', fontSize: '0.9rem' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros por pestaña adaptados para no desbordar en móvil */}
          <div className="alert-filter-tabs">
            {[
              { id: 'ALL', label: `Todas (${totalCount})`, short: `Todas (${totalCount})` },
              { id: 'NUEVA', label: `Nuevas (${newCount})`, short: `Nuevas (${newCount})` },
              { id: 'EN PROCESO', label: `En Proceso (${inProgressCount})`, short: `Proceso (${inProgressCount})` },
              { id: 'RESUELTA', label: `Resueltas (${resolvedCount})`, short: `Resueltas (${resolvedCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`alert-tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
                style={{
                  padding: '7px 12px', borderRadius: '8px', border: 'none',
                  fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: activeFilter === tab.id ? 'var(--color-accent)' : 'transparent',
                  color: activeFilter === tab.id ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <span className="tab-label-desktop">{tab.label}</span>
                <span className="tab-label-mobile">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: HISTORIAL DE ALERTAS (MODAL TRIGGER SIN SCROLL INFINITO) */}
      {loading && requests.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
          <Loader2 className="animate-spin" size={44} color="var(--color-accent)" />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Cargando señales de la red...</span>
        </div>
      ) : requests.length === 0 ? (
        /* ESTADO SIN ALERTAS EN LA RED */
        <div className="bento-card" style={{ textAlign: 'center', padding: '60px 24px', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
          <div className="glow-accent" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', opacity: 0.1 }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
              <CheckCircle2 size={44} color="#10b981" />
            </div>
            <h2 style={{ marginBottom: '8px', color: 'var(--color-text-primary)', fontSize: '1.4rem' }}>Todo Operando Con Normalidad</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0', maxWidth: '420px', fontSize: '0.95rem' }}>
              No hay reportes ni alertas registradas. Cualquier señal enviada desde un código QR físico aparecerá aquí al instante.
            </p>
          </div>
        </div>
      ) : (
        /* TARJETA / PANEL HISTORIAL DE ALERTAS */
        <div className="bento-card bento-card-alerts" style={{ padding: '26px 24px', position: 'relative', overflow: 'hidden' }}>
          <div className="glow-accent" style={{ top: '-40px', right: '-40px', width: '200px', height: '200px', background: '#e11d48', opacity: 0.12 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px', marginBottom: '22px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldAlert size={20} color="#e11d48" />
                  <span style={{ color: '#e11d48', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Centro de Monitoreo
                  </span>
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.65rem', color: 'var(--color-text-primary)', fontWeight: '800' }}>
                  Historial de Alertas
                </h2>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '540px' }}>
                  Consulta la bitácora completa de llamadas y solicitudes de clientes. Visualiza y despacha cada caso de forma organizada desde el modal interactivo.
                </p>
              </div>

              {/* Botón Ver Historial de Alertas */}
              <button 
                className="btn-primary"
                onClick={() => setIsHistoryModalOpen(true)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)'
                }}
              >
                <Layers size={18} />
                <span>Ver Historial de Alertas</span>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.25)', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: '0.78rem', 
                  fontWeight: '800' 
                }}>
                  {filteredRequests.length}
                </span>
              </button>
            </div>

            {/* Vista compacta de señales recientes */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                  Señales recientes en la red ({Math.min(filteredRequests.length, 3)} de {filteredRequests.length}):
                </span>
                <button 
                  onClick={() => setIsHistoryModalOpen(true)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Ver todas en modal</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredRequests.slice(0, 3).map(req => {
                  const s = (req.status || 'NUEVA').toUpperCase();
                  const isNew = s === 'NUEVA' || s === 'PENDIENTE';
                  const isInProg = s === 'EN PROCESO';
                  const dotColor = isNew ? '#ef4444' : isInProg ? '#f59e0b' : '#10b981';
                  return (
                    <div 
                      key={req.id}
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="feed-item-row"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', gap: '12px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}`, flexShrink: 0 }}></span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.business_name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.city || 'Ubicación'} · <span style={{ fontStyle: 'italic' }}>"{req.message || 'Sin mensaje adicional'}"</span>
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: `${dotColor}20`, color: dotColor }}>
                          {s}
                        </span>
                        <ChevronRight size={16} color="var(--color-text-secondary)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL COMPLETO CON HISTORIAL DE ALERTAS (RESPONSIVE EN TODAS LAS PANTALLAS) */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title="Historial de Alertas" 
        maxWidth="860px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '12px' }}>
          
          {/* Barra Superior Fija: Búsqueda y Filtros */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            paddingBottom: '12px', 
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0 
          }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input
                type="text"
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por comercio, ciudad o mensaje..."
                style={{ paddingLeft: '38px', paddingRight: searchQuery ? '34px' : '12px', height: '40px', fontSize: '0.88rem', width: '100%', borderRadius: '10px' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Pestañas de Estado (Alineadas estrictamente en 1 sola línea en Android y móvil) */}
            <div className="alert-filter-tabs-modal">
              {[
                { id: 'ALL', label: `Todas (${totalCount})`, mobileLabel: `Todas (${totalCount})` },
                { id: 'NUEVA', label: `Nuevas (${newCount})`, mobileLabel: `Nuevas (${newCount})` },
                { id: 'EN PROCESO', label: `En Proceso (${inProgressCount})`, mobileLabel: `Proceso (${inProgressCount})` },
                { id: 'RESUELTA', label: `Resueltas (${resolvedCount})`, mobileLabel: `Resueltas (${resolvedCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`alert-modal-tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
                >
                  <span className="tab-label-desktop">{tab.label}</span>
                  <span className="tab-label-mobile">{tab.mobileLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Listado con Scroll propio y cartas completas sin recortes */}
          <div 
            className="custom-scrollbar alert-modal-cards-container"
            style={{ 
              flex: 1,
              minHeight: 0,
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '14px',
              paddingRight: '4px',
              paddingBottom: '14px' 
            }}
          >
            {filteredRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <Filter size={34} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-text-primary)', fontSize: '1rem' }}>Sin alertas coincidentes</h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  No se encontraron resultados con los filtros actuales.
                </p>
                <button 
                  className="btn-secondary" 
                  onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }}
                  style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              filteredRequests.map(req => {
                const rawStatus = (req.status || 'NUEVA').toUpperCase();
                const isNew = rawStatus === 'NUEVA' || rawStatus === 'PENDIENTE';
                const isInProgress = rawStatus === 'EN PROCESO';
                const isResolved = rawStatus === 'RESUELTA' || rawStatus === 'ATENDIDA';

                const statusColor = isNew ? '#ef4444' : isInProgress ? '#f59e0b' : '#10b981';
                const statusBg = isNew ? 'rgba(239, 68, 68, 0.1)' : isInProgress ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                const statusBorder = isNew ? 'rgba(239, 68, 68, 0.3)' : isInProgress ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';
                const pulseClass = isNew ? 'alert-dot-pulse-red' : isInProgress ? 'alert-dot-pulse-amber' : '';

                const waLink = getWhatsAppLink(req.phone, req.business_name);
                const isUpdating = updatingId === req.id;

                const categoryClass = 
                  activeFilter === 'ALL' ? 'alert-card-cat-all' :
                  activeFilter === 'NUEVA' ? 'alert-card-cat-nueva' :
                  activeFilter === 'EN PROCESO' ? 'alert-card-cat-proceso' :
                  'alert-card-cat-resuelta';

                const statusClass = `status-${rawStatus.toLowerCase().replace(/\s+/g, '-')}`;

                return (
                  <div 
                    key={req.id}
                    className={`alert-card-compact ${categoryClass} ${statusClass}`}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      borderLeft: `4px solid ${statusColor}`,
                      position: 'relative',
                      flexShrink: 0,
                      minHeight: 'fit-content',
                      height: 'auto',
                      overflow: 'visible',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Fila 1: Logo + Nombre + Estado + Tiempo (Responsive) */}
                    <div className="alert-modal-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: 1 }}>
                        {req.logo_url ? (
                          <img 
                            src={getLogoUrl(req.logo_url)} 
                            alt="" 
                            style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={20} color="var(--color-accent)" />
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span 
                              onClick={() => { setIsHistoryModalOpen(false); navigate(`/mapa?focus=${req.business_id}`); }}
                              style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                              title="Localizar en el mapa radar"
                            >
                              {req.business_name}
                            </span>
                            <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--color-accent)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {req.type || 'SOPORTE'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} color="var(--color-accent)" /> {req.city || 'Sin ciudad'}
                            </span>
                            {req.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                                <Phone size={13} color="var(--color-accent)" /> {req.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Estado y Hora */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`,
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase'
                        }}>
                          {pulseClass && <span className={pulseClass} style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }}></span>}
                          {!pulseClass && <CheckCircle2 size={12} />}
                          <span>
                            {isInProgress 
                              ? `En revisión ${req.attended_by ? `por ${req.attended_by}` : ''}`
                              : isResolved 
                                ? `Completado ${req.resolved_by || req.attended_by ? `por ${req.resolved_by || req.attended_by}` : ''}`
                                : 'Nueva Alerta'}
                          </span>
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Fila 2: Mensaje del Cliente (Completo, sin cortes) */}
                    <div 
                      className="alert-message-box"
                      style={{ 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        borderLeft: `3px solid ${statusColor}`,
                        marginBottom: '12px',
                        background: 'rgba(0,0,0,0.2)' 
                      }}
                    >
                      <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.88rem', lineHeight: '1.45', fontStyle: 'italic', wordBreak: 'break-word' }}>
                        "{req.message || 'Sin mensaje adicional'}"
                      </p>
                    </div>

                    {/* Fila 3: Acciones Rápidas (Adaptadas a Móvil y Escritorio) */}
                    <div className="alert-modal-actions-container">
                      <div className="alert-modal-actions-group">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="alert-btn-wa"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '8px 14px', borderRadius: '8px',
                              background: 'rgba(37, 211, 102, 0.14)', color: '#16a34a',
                              border: '1px solid rgba(37, 211, 102, 0.35)', textDecoration: 'none',
                              fontSize: '0.82rem', fontWeight: '750', minHeight: '38px'
                            }}
                          >
                            <MessageCircle size={15} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => { setIsHistoryModalOpen(false); navigate(`/mapa?focus=${req.business_id}`); }}
                          className="alert-btn-map"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '8px',
                            background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-accent)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            fontSize: '0.82rem', fontWeight: '650', cursor: 'pointer', minHeight: '38px'
                          }}
                        >
                          <MapPin size={15} />
                          <span>Ver en Mapa</span>
                        </button>
                      </div>

                      {/* Botones de flujo */}
                      <div className="alert-modal-actions-group">
                        {isNew && (
                          <button
                            onClick={(e) => updateStatus(req.id, 'EN PROCESO', e)}
                            disabled={isUpdating}
                            className="alert-btn-take"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '8px 14px', borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.3)', cursor: 'pointer',
                              fontSize: '0.82rem', fontWeight: '700', minHeight: '38px'
                            }}
                          >
                            <Clock size={14} />
                            <span>Tomar Caso</span>
                          </button>
                        )}

                        {!isResolved && (
                          <button
                            onClick={(e) => updateStatus(req.id, 'RESUELTA', e)}
                            disabled={isUpdating}
                            className="alert-btn-resolve"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '8px 14px', borderRadius: '8px',
                              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer',
                              fontSize: '0.82rem', fontWeight: '700', minHeight: '38px'
                            }}
                          >
                            <Check size={14} />
                            <span>Resolver</span>
                          </button>
                        )}

                        {isResolved && (
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '0.78rem', fontWeight: '750', minHeight: '38px'
                          }}>
                            <CheckCircle2 size={14} />
                            <span>Completado {req.resolved_by || req.attended_by ? `por ${req.resolved_by || req.attended_by}` : ''}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}
