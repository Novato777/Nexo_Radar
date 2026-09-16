import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { 
  ArrowLeft, Loader2, AlertCircle, Search, Building2, 
  MapPin, ShieldCheck, Clock, CheckCircle2, MessageCircle, Navigation 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { API_BASE, getLogoUrl, buildWhatsAppUrl, getResolvedWhatsAppMessage } from '../config';

// --- GENERADOR DE ÍCONO DE MARCADOR DINÁMICO ---
// El indicador del cliente cambia de color y etiqueta según el estado de la alerta:
// 🔴 NUEVA: Borde rojo, punto rojo pulsante y etiqueta 'NUEVA'
// 🟡 EN PROCESO: Borde amarillo, punto ámbar y etiqueta 'REVISIÓN'
// 🟢 RESUELTA: Borde verde, punto verde y etiqueta 'RESUELTO'
// 🔷 NORMAL: Borde cyan, punto verde y etiqueta 'SEGURO'
const createCustomIcon = (logoUrl, alertStatus, attendedBy) => {
  let borderColor = '#10b981';
  let badgeColor = '#10b981';
  let pulseClass = '';
  let statusTag = 'SEGURO';
  let tagBg = '#10b981';
  let tagColor = '#020617';

  if (alertStatus === 'NUEVA') {
    borderColor = '#ef4444';
    badgeColor = '#ef4444';
    pulseClass = 'pulse-animation-red';
    statusTag = 'NUEVA';
    tagBg = '#ef4444';
    tagColor = '#ffffff';
  } else if (alertStatus === 'EN PROCESO') {
    borderColor = '#f59e0b';
    badgeColor = '#f59e0b';
    pulseClass = 'pulse-animation-amber';
    const collaboratorFirstName = attendedBy ? attendedBy.trim().split(' ')[0] : '';
    statusTag = collaboratorFirstName ? `REVISIÓN (${collaboratorFirstName})` : 'REVISIÓN';
    tagBg = '#f59e0b';
    tagColor = '#020617';
  } else if (alertStatus === 'RESUELTA') {
    borderColor = '#10b981';
    badgeColor = '#10b981';
    pulseClass = '';
    statusTag = 'RESUELTO';
    tagBg = '#10b981';
    tagColor = '#020617';
  } else {
    borderColor = 'var(--color-accent)';
    badgeColor = '#10b981';
    statusTag = 'ONLINE';
    tagBg = 'var(--color-accent)';
    tagColor = '#020617';
  }

  const htmlContent = logoUrl 
    ? `<img src="${getLogoUrl(logoUrl)}" style="width: 44px; height: 44px; border-radius: 50%; border: 3.5px solid ${borderColor}; object-fit: cover; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.6);" />` 
    : `<div style="background-color: var(--color-surface); width: 44px; height: 44px; border-radius: 50%; border: 3.5px solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${borderColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
       </div>`;

  return new L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
        <div class="${pulseClass}" style="position: relative; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center;">
          ${htmlContent}
          <div style="position: absolute; top: -3px; right: -3px; background: ${badgeColor}; border-radius: 50%; width: 14px; height: 14px; border: 2px solid #0f172a; box-shadow: 0 0 8px ${badgeColor};"></div>
        </div>
        <div style="background: ${tagBg}; color: ${tagColor}; font-size: 8.5px; font-weight: 800; padding: 1px 7px; border-radius: 8px; text-transform: uppercase; margin-top: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.7); letter-spacing: 0.04em; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
          ${statusTag}
        </div>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [60, 60],
    iconAnchor: [30, 30]
  });
};

// Generador de ícono pulsante para la ubicación del usuario (GPS en vivo)
const createUserLocationIcon = () => {
  return new L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: userLocationPulse 1.8s infinite ease-out;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #06b6d4; z-index: 10;"></div>
      </div>
    `,
    className: 'user-gps-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
};

// Componente para volar la cámara programáticamente
function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 16, { animate: true, duration: 0.6 });
    }
  }, [center, map]);
  return null;
}

// Componente dedicado para el Marker con actualización forzada de icono en Leaflet
function BusinessMarker({ biz, alertStatus, alert, onUpdateStatus, customMarker, isUpdating, formatDate }) {
  const markerRef = useRef(null);

  // Asegura que cuando cambie el estado de la alerta, el marcador cambie de color sin cerrar el popup
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(customMarker);
    }
  }, [customMarker]);

  const isNew = alertStatus === 'NUEVA';
  const isInProgress = alertStatus === 'EN PROCESO';
  const isResolved = alertStatus === 'RESUELTA';

  // Enlace y mensaje pre-escrito de agradecimiento y cortesía por WhatsApp
  const thankYouMsg = getResolvedWhatsAppMessage(biz.business_name);
  const waUrl = buildWhatsAppUrl(biz.phone, thankYouMsg);

  return (
    <Marker 
      ref={markerRef}
      position={[parseFloat(biz.latitude), parseFloat(biz.longitude)]}
      icon={customMarker}
    >
      <Popup>
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Header: Logo y Nombre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            {biz.logo_url ? (
              <img 
                src={getLogoUrl(biz.logo_url)} 
                alt={biz.business_name} 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo-icon-radar.png'; }}
                style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
              />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="var(--color-text-secondary)" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 3px 0', fontSize: '1.1rem', color: 'var(--color-text-primary)', lineHeight: 1.2, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {biz.business_name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  {biz.phone || 'Sin teléfono'}
                </span>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.35)',
                      color: '#16a34a',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                    title="Abrir chat de WhatsApp con mensaje pre-escrito"
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Ubicación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            <MapPin size={14} color="var(--color-accent)" />
            <span>{biz.city || 'Ubicación no especificada'}</span>
          </div>

          {/* Reporte / Alerta del Cliente */}
          {alert ? (
            <div style={{ 
              padding: '12px', 
              background: isNew ? 'rgba(239, 68, 68, 0.1)' : isInProgress ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              border: `1px solid ${isNew ? 'rgba(239, 68, 68, 0.3)' : isInProgress ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px' 
            }}>
              {/* Estado y Tipo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ 
                  fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: isNew ? '#ef4444' : isInProgress ? '#f59e0b' : '#10b981',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  {isNew ? <AlertCircle size={14} /> : isInProgress ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                  {alert.type || 'REQUERIMIENTO'}
                </span>
                
                <span style={{ 
                  fontSize: '0.68rem', padding: '3px 8px', borderRadius: '10px', fontWeight: '800',
                  background: isNew ? '#ef4444' : isInProgress ? '#f59e0b' : '#10b981',
                  color: isNew ? '#fff' : '#0f172a',
                  textTransform: 'uppercase'
                }}>
                  {isInProgress 
                    ? `En revisión ${alert.attended_by ? `por ${alert.attended_by}` : ''}`
                    : isResolved
                      ? `Completado ${alert.resolved_by || alert.attended_by ? `por ${alert.resolved_by || alert.attended_by}` : ''}`
                      : 'Nueva'}
                </span>
              </div>
              
              {/* Mensaje */}
              {alert.message && (
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-primary)', fontStyle: 'italic', lineHeight: 1.4, borderLeft: `2.5px solid ${isNew ? '#ef4444' : isInProgress ? '#f59e0b' : '#10b981'}`, paddingLeft: '8px' }}>
                  "{alert.message}"
                </p>
              )}
              
              {/* Fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                <Clock size={11} />
                <span>{formatDate(alert.created_at)}</span>
              </div>

              {/* BOTONES DE ACCIÓN: CIERRE DE CICLO */}
              {isResolved ? (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '10px', 
                  background: 'rgba(16, 185, 129, 0.12)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center',
                  marginTop: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    <CheckCircle2 size={15} />
                    <span>Ciclo Cerrado · Completado {alert.resolved_by || alert.attended_by ? `por ${alert.resolved_by || alert.attended_by}` : ''}</span>
                  </div>
                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.74rem', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                    Esta alerta fue completada y su ciclo se ha cerrado.
                  </p>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#16a34a',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#15803d'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#16a34a'}
                    >
                      <MessageCircle size={15} />
                      <span>Enviar Agradecimiento por WhatsApp</span>
                    </a>
                  )}
                </div>
              ) : isInProgress ? (
                <div style={{ marginTop: '6px' }}>
                  {alert.attended_by && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: '700', marginBottom: '6px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      Atendido actualmente por: <strong>{alert.attended_by}</strong>
                    </div>
                  )}
                  <button
                    onClick={() => alert && onUpdateStatus(alert.id, biz.id, 'RESUELTA')}
                    disabled={isUpdating}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1.5px solid #10b981',
                      color: '#10b981',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Completar alerta y cerrar ciclo definitivamente"
                  >
                    <CheckCircle2 size={15} />
                    <span>Completar Alerta (Cerrar Ciclo)</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  {/* Botón Amarillo de Revisión */}
                  <button
                    onClick={() => alert && onUpdateStatus(alert.id, biz.id, 'EN PROCESO')}
                    disabled={isUpdating}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1.5px solid #f59e0b',
                      color: '#f59e0b',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Pasar alerta a categoría En Revisión"
                  >
                    <Clock size={14} />
                    <span>Revisión</span>
                  </button>

                  {/* Botón Verde de Resuelto */}
                  <button
                    onClick={() => alert && onUpdateStatus(alert.id, biz.id, 'RESUELTA')}
                    disabled={isUpdating}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1.5px solid #10b981',
                      color: '#10b981',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Completar alerta y cerrar ciclo"
                  >
                    <CheckCircle2 size={14} />
                    <span>Resuelto</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
              <ShieldCheck size={18} style={{ marginRight: '6px' }} />
              Nodo Seguro · Sin Alertas
            </div>
          )}

        </div>
      </Popup>
    </Marker>
  );
}

export default function RadarMap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [businesses, setBusinesses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState(() => {
    try {
      const saved = localStorage.getItem('nexo_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          return [parsed.latitude, parsed.longitude];
        }
      }
    } catch {}
    return [4.6097, -74.0817]; // Default Bogotá
  });
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('nexo_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          return [parsed.latitude, parsed.longitude];
        }
      }
    } catch {}
    return null;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [updatingBusinessId, setUpdatingBusinessId] = useState(null);

  // Solicitar permiso de ubicación y centrar el radar automáticamente en la posición del usuario
  const locateUser = (animate = true) => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        if (animate) {
          setMapCenter(coords);
        }
        try {
          localStorage.setItem('nexo_user_location', JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: Date.now()
          }));
        } catch {}
        setIsLocating(false);
      },
      (err) => {
        console.debug('Geolocalización denegada o no disponible:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchData = async () => {
    try {
      const [bizRes, reqRes] = await Promise.all([
        axios.get(`${API_BASE}/api/businesses`),
        axios.get(`${API_BASE}/api/requests`)
      ]);
      
      const safeBiz = Array.isArray(bizRes.data) ? bizRes.data : [];
      const safeReq = Array.isArray(reqRes.data) ? reqRes.data : [];

      setBusinesses(safeBiz);
      setRequests(safeReq);
      setLoading(false);

      // Revisar si venimos de un click en AlertCenter o Dashboard
      const params = new URLSearchParams(location.search);
      const focusId = params.get('focus');
      if (focusId) {
        const bizToFocus = safeBiz.find(b => b.id === focusId);
        if (bizToFocus && bizToFocus.latitude && bizToFocus.longitude) {
          setMapCenter([parseFloat(bizToFocus.latitude), parseFloat(bizToFocus.longitude)]);
        }
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      setBusinesses([]);
      setRequests([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, [location.search]);

  useEffect(() => {
    // Si no venimos de un focus específico por URL, pedir ubicación y centrar allí automáticamente
    const params = new URLSearchParams(location.search);
    if (!params.get('focus')) {
      locateUser(true);
    }
  }, [location.search]);

  // Sincronización en tiempo real vía Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (newReq) => {
      setRequests(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return [newReq, ...arr.filter(r => r.id !== newReq.id)];
      });
    };

    const handleRequestUpdated = (updatedReq) => {
      setRequests(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map(r => r.id === updatedReq.id ? { ...r, ...updatedReq } : r);
      });
    };

    const handleBusinessChanged = () => {
      fetchData();
    };

    socket.on('new_request', handleNewRequest);
    socket.on('request_updated', handleRequestUpdated);
    socket.on('business_data_changed', handleBusinessChanged);

    return () => {
      socket.off('new_request', handleNewRequest);
      socket.off('request_updated', handleRequestUpdated);
      socket.off('business_data_changed', handleBusinessChanged);
    };
  }, [socket]);

  // Actualizar la alerta específica seleccionada (NUNCA alterar alertas ya resueltas del historial)
  const handleUpdateBusinessAlerts = async (alertId, businessId, newStatus) => {
    if (!alertId) return;
    setUpdatingBusinessId(businessId);

    const currentUserName = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('nexo_user'));
        return u?.name || 'Colaborador';
      } catch {
        return 'Colaborador';
      }
    })();

    // Si la alerta es RESUELTA, abrir de inmediato WhatsApp sincrónicamente para que el navegador no bloquee la pestaña
    let waWindow = null;
    if (newStatus === 'RESUELTA') {
      const targetBiz = businesses.find(b => b.id === businessId);
      if (targetBiz && targetBiz.phone) {
        const msg = getResolvedWhatsAppMessage(targetBiz.business_name);
        const waUrl = buildWhatsAppUrl(targetBiz.phone, msg);
        if (waUrl) {
          waWindow = window.open(waUrl, '_blank');
        }
      }
    }

    // 1. Actualización optimista de EXCLUSIVAMENTE la alerta seleccionada en el estado local
    setRequests(prev => prev.map(r => r.id === alertId ? { 
      ...r, 
      status: newStatus,
      attended_by: newStatus === 'EN PROCESO' ? (r.attended_by || currentUserName) : r.attended_by,
      resolved_by: newStatus === 'RESUELTA' ? currentUserName : r.resolved_by
    } : r));

    try {
      // 2. Enviar actualización al backend con el colaborador asignado
      await axios.patch(`${API_BASE}/api/requests/${alertId}`, { 
        status: newStatus,
        attended_by: newStatus === 'EN PROCESO' ? currentUserName : undefined,
        resolved_by: newStatus === 'RESUELTA' ? currentUserName : undefined
      });
    } catch (err) {
      console.error('Error actualizando alerta:', err);
      if (waWindow) waWindow.close();
      alert('Hubo un error al actualizar el estado de la alerta.');
    } finally {
      setUpdatingBusinessId(null);
    }
  };

  // Buscador de Ciudades con Nominatim (Colombia)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        setSearching(true);
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=co&q=${encodeURIComponent(searchQuery)}`)
          .then(res => {
            setSuggestions(res.data);
            setSearching(false);
          })
          .catch(err => {
            console.error('Error fetching cities:', err);
            setSearching(false);
          });
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectCity = (cityData) => {
    const lat = parseFloat(cityData.lat);
    const lon = parseFloat(cityData.lon);
    setMapCenter([lat, lon]);
    setSearchQuery('');
    setSuggestions([]);
  };

  // Determinar el estado prioritario de alerta de un comercio
  const getBusinessAlertState = (businessId) => {
    const bizRequests = requests.filter(r => r.business_id === businessId);
    if (bizRequests.length === 0) {
      return { status: 'NORMAL', alert: null };
    }

    // 1. Prioridad: ¿Tiene alertas NUEVAS o PENDIENTES? (Rojo)
    const newReq = bizRequests.find(r => {
      const s = (r.status || '').toUpperCase();
      return s === 'NUEVA' || s === 'PENDIENTE';
    });
    if (newReq) return { status: 'NUEVA', alert: newReq };

    // 2. Prioridad: ¿Tiene alertas EN PROCESO / REVISIÓN? (Amarillo)
    const inProgReq = bizRequests.find(r => (r.status || '').toUpperCase() === 'EN PROCESO');
    if (inProgReq) return { status: 'EN PROCESO', alert: inProgReq };

    // 3. Si todas son RESUELTAS (Verde)
    const resolvedReq = bizRequests[0];
    return { status: 'RESUELTA', alert: resolvedReq };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flex: 1, minHeight: 'calc(100vh - 70px)', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-accent)" />
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Cargando radar de nodos...</span>
      </div>
    );
  }
  
  return (
    <div className="radar-map-wrapper">
      
      {/* Buscador Flotante */}
      <div className="radar-search-container">
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            className="map-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ciudad en el mapa..." 
          />
          {searching && <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />}
        </div>
        
        {/* Sugerencias */}
        {suggestions.length > 0 && (
          <ul className="map-search-suggestions">
            {suggestions.map((sug, idx) => (
              <li 
                key={idx} 
                onClick={() => handleSelectCity(sug)}
                className="map-search-suggestion-item"
              >
                {sug.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leyenda de Estados del Radar (Posicionamiento adaptativo: superior izquierda en desktop, inferior izquierda en móvil) */}
      <div className="radar-legend">
        <div className="legend-title" style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800', marginBottom: '2px' }}>
          Estado de Indicadores
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--color-text-primary)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}></span>
          <span>Nueva Alerta</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--color-text-primary)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }}></span>
          <span>En Revisión</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--color-text-primary)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
          <span>Resuelto / Seguro</span>
        </div>
      </div>

      <style>
        {`
          .radar-map-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .radar-search-container {
            position: absolute;
            top: 18px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            width: 90%;
            max-width: 450px;
          }

          .map-search-input {
            width: 100%;
            padding: 13px 40px 13px 44px;
            background-color: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 24px;
            color: var(--color-text-primary);
            font-family: inherit;
            outline: none;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            font-size: 0.92rem;
            transition: all 0.2s ease;
          }

          [data-theme="light"] .map-search-input {
            background-color: rgba(255, 255, 255, 0.95);
            border-color: rgba(6, 182, 212, 0.5);
            color: #0f172a;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }

          .map-search-input:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.25);
          }

          .map-search-suggestions {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            background: var(--color-surface);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 280px;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          }

          [data-theme="light"] .map-search-suggestions {
            background: #ffffff;
            border-color: rgba(0,0,0,0.1);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          }

          .map-search-suggestion-item {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            cursor: pointer;
            font-size: 0.92rem;
            color: var(--color-text-primary);
            transition: background-color 0.15s;
          }

          [data-theme="light"] .map-search-suggestion-item {
            border-bottom-color: rgba(0,0,0,0.06);
            color: #0f172a;
          }

          .map-search-suggestion-item:hover {
            background-color: rgba(6, 182, 212, 0.1);
          }

          @media (max-width: 768px) {
            .radar-search-container {
              top: 12px;
              width: 92%;
            }
            .map-search-input {
              font-size: 16px !important;
              padding: 11px 36px 11px 40px;
            }
            /* Ubicación y tamaño ergonómico de controles de zoom en Android / móvil sobre la barra inferior */
            .leaflet-bottom.leaflet-right {
              bottom: 30px !important; /* Más pegado a la esquina inferior derecha */
              right: 14px !important;
            }
            .leaflet-control-zoom {
              border-radius: 12px !important;
              overflow: hidden !important;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
            }
            .leaflet-control-zoom a {
              width: 40px !important;
              height: 40px !important;
              line-height: 40px !important;
              font-size: 22px !important;
              background-color: var(--color-surface, #0f172a) !important;
              color: var(--color-text-primary, #f8fafc) !important;
            }
          }

          .pulse-animation-red {
            animation: pulse-red 1.6s infinite;
          }
          @keyframes pulse-red {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.85); }
            70% { transform: scale(1.08); box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          .pulse-animation-amber {
            animation: pulse-amber 1.8s infinite;
          }
          @keyframes pulse-amber {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.85); }
            70% { transform: scale(1.08); box-shadow: 0 0 0 14px rgba(245, 158, 11, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          }

          @keyframes userLocationPulse {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(2.4); opacity: 0; }
          }
        `}
      </style>

      {/* MAPA */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Botón Flotante de GPS para centrar en la ubicación del dispositivo */}
        <button
          onClick={() => locateUser(true)}
          title="Centrar en mi ubicación actual"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 400,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            color: '#f8fafc',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#06b6d4'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)'}
        >
          <Navigation size={15} color="var(--color-accent)" className={isLocating ? 'animate-spin' : ''} />
          <span>Mi Ubicación</span>
        </button>

        <MapContainer
          center={mapCenter}
          zoom={6}
          minZoom={3}
          maxZoom={21}
          zoomSnap={0.5}
          zoomDelta={1}
          wheelPxPerZoomLevel={120}
          touchZoom={true}
          tap={false}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className="dark-map"
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxNativeZoom={19}
            maxZoom={21}
          />
          <MapFlyTo center={mapCenter} />

          {/* Marcador de Ubicación del Usuario / Dispositivo */}
          {userLocation && (
            <Marker position={userLocation} icon={createUserLocationIcon()}>
              <Popup>
                <div style={{ textAlign: 'center', padding: '6px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#06b6d4', fontWeight: '800', fontSize: '0.85rem' }}>
                    <Navigation size={14} /> Tu Ubicación en Vivo
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Dispositivo conectado al radar
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {businesses.map(biz => {
            if (!biz.latitude || !biz.longitude) return null;
            
            const { status: alertStatus, alert } = getBusinessAlertState(biz.id);
            const customMarker = createCustomIcon(biz.logo_url, alertStatus, alert?.attended_by);
            
            return (
              <BusinessMarker
                key={biz.id}
                biz={biz}
                alertStatus={alertStatus}
                alert={alert}
                onUpdateStatus={handleUpdateBusinessAlerts}
                customMarker={customMarker}
                isUpdating={updatingBusinessId === biz.id}
                formatDate={formatDate}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
