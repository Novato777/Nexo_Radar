import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, MapPin, BellRing, Activity, Loader2, Zap, ShieldCheck, ArrowUpRight, BarChart3, Globe, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function HomeDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [bizRes, reqRes] = await Promise.all([
        axios.get('http://127.0.0.1:5000/api/businesses'),
        axios.get('http://127.0.0.1:5000/api/requests')
      ]);
      setBusinesses(bizRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sincronización en tiempo real vía Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (newReq) => {
      setRequests(prev => [newReq, ...prev.filter(r => r.id !== newReq.id)]);
    };

    const handleRequestUpdated = (updatedReq) => {
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? { ...r, ...updatedReq } : r));
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

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-accent)" />
      </div>
    );
  }

  const pendingAlerts = requests.filter(r => {
    const s = (r.status || '').toUpperCase();
    return s === 'NUEVA' || s === 'PENDIENTE';
  });
  
  // Calcular ciudades únicas y top
  const cityCount = businesses.reduce((acc, b) => {
    if (b.city) {
      acc[b.city] = (acc[b.city] || 0) + 1;
    }
    return acc;
  }, {});
  const uniqueCities = Object.keys(cityCount).length;
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
      
      {/* HEADER HERO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={20} color="var(--color-accent)" />
            <span style={{ color: 'var(--color-accent)', fontWeight: '700', letterSpacing: '0.1em', fontSize: '0.85rem', textTransform: 'uppercase' }}>Command Center</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2.6rem', fontWeight: '800', lineHeight: '1.2', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Ne<span style={{ color: '#0284c7' }}>X</span>o Radar
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Métricas en tiempo real de la red NeXo Radar.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/register')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: '600' }}
        >
          <Zap size={18} />
          Nueva Terminal
        </button>
      </div>

      {/* BENTO GRID */}
      <div className="bento-grid">
        
        {/* BIG CARD: TERMINALES (Span 8 escritorio, Span 2 móvil) */}
        <div className="bento-card bento-card-terminals col-span-8 m-col-span-2" style={{ minHeight: '200px', cursor: 'pointer' }} onClick={() => navigate('/terminales')}>
          <div className="glow-accent" style={{ top: '-50px', right: '-50px' }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="bento-icon-container" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', padding: '12px', borderRadius: '16px' }}>
                <Building2 size={28} color="var(--color-accent)" />
              </div>
              <ArrowUpRight size={24} color="var(--color-text-secondary)" style={{ opacity: 0.6 }} />
            </div>
            
            <div style={{ marginTop: 'auto' }}>
              <p className="bento-medium-text" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px' }}>Total Terminales</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span className="bento-big-text" style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--color-text-primary)', lineHeight: '1', letterSpacing: '-0.02em' }}>{businesses.length}</span>
                <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>+12% mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTAS PENDIENTES (Span 4 escritorio, Span 1 móvil -> Mitad) */}
        <div className={`bento-card bento-card-alerts col-span-4 m-col-span-1 ${pendingAlerts.length > 0 ? 'has-alerts' : ''}`} style={{ cursor: 'pointer' }} onClick={() => navigate('/alertas')}>
          {pendingAlerts.length > 0 && <div className="glow-danger" style={{ top: '-50px', right: '-50px' }}></div>}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="bento-icon-container" style={{ background: pendingAlerts.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${pendingAlerts.length > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`, padding: '12px', borderRadius: '16px' }}>
                <BellRing size={28} color={pendingAlerts.length > 0 ? '#ef4444' : 'var(--color-text-secondary)'} />
              </div>
            </div>
            
            <div style={{ marginTop: 'auto' }}>
              <p className="bento-medium-text" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px' }}>Señales</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="bento-big-text" style={{ fontSize: '3.5rem', fontWeight: '900', color: pendingAlerts.length > 0 ? '#ef4444' : 'var(--color-text-primary)', lineHeight: '1' }}>{pendingAlerts.length}</span>
                {pendingAlerts.length > 0 && <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: '700', lineHeight: '1.2' }}>Requieren atención</span>}
              </div>
            </div>
          </div>
        </div>

        {/* CIUDADES CUBIERTAS (Span 4 escritorio, Span 1 móvil -> Mitad) */}
        <div className="bento-card bento-card-cities col-span-4 m-col-span-1" onClick={() => navigate('/mapa')} style={{ cursor: 'pointer' }}>
          <div className="glow-accent" style={{ bottom: '-50px', left: '-50px', background: '#10b981' }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
             <div className="bento-icon-container" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '16px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '16px', alignSelf: 'flex-start' }}>
               <Globe size={28} color="#10b981" />
             </div>
             
             <div style={{ marginTop: 'auto' }}>
               <p className="bento-medium-text" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px' }}>Ciudades</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 <p className="bento-big-text" style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--color-text-primary)', margin: 0, lineHeight: '1' }}>{uniqueCities}</p>
               </div>
             </div>
          </div>
        </div>

        {/* TOP CIUDADES LIST (Span 4 escritorio, Span 2 móvil) */}
        <div className="bento-card bento-card-zones col-span-4 m-col-span-2" style={{ padding: '20px' }}>
          <div className="glow-accent" style={{ top: '-50px', left: '-50px', background: '#8b5cf6', opacity: 0.15 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#8b5cf6" /> Top Zonas
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topCities.length === 0 ? <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Sin datos</p> : null}
              {topCities.map(([city, count], idx) => {
                 const maxCount = topCities[0][1];
                 const percentage = (count / maxCount) * 100;
                 return (
                  <li key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>{city}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{count}</span>
                    </div>
                    <div className="progress-track-bg" style={{ height: '7px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #0284c7, #06b6d4)', borderRadius: '4px' }}></div>
                    </div>
                  </li>
                 )
              })}
            </ul>
          </div>
        </div>

        {/* HISTORIAL DE ALERTAS / ACTIVITY FEED (Span 4 escritorio, Span 2 móvil) */}
        <div className="bento-card bento-card-feed col-span-4 m-col-span-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div className="glow-accent" style={{ bottom: '-50px', right: '-50px', background: '#f59e0b', opacity: 0.15 }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#f59e0b" /> Historial de Alertas
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                {requests.length} registradas
              </span>
            </div>

            {/* Scroll de alertas para evitar que se desborde el diseño */}
            <div 
              className="custom-scrollbar"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}
            >
              {requests.length === 0 ? <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>Ninguna señal registrada.</p> : null}
              {requests.map(req => {
                const s = (req.status || 'NUEVA').toUpperCase();
                const isNew = s === 'NUEVA' || s === 'PENDIENTE';
                const isInProg = s === 'EN PROCESO';
                const dotColor = isNew ? '#ef4444' : isInProg ? '#f59e0b' : '#10b981';
                return (
                  <div 
                    key={req.id} 
                    onClick={() => navigate('/alertas')}
                    className="feed-item-row"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}`, flexShrink: 0 }}></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.business_name}</p>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>{req.type} · <span style={{ color: dotColor, fontWeight: '700' }}>{s}</span></p>
                    </div>
                    <ChevronRight size={16} color="var(--color-text-secondary)" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
