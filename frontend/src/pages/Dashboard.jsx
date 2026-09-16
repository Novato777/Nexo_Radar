import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, MapPin, Phone, Trash2, Plus, QrCode, 
  AlertTriangle, ShieldCheck, Folder, ArrowLeft, 
  ExternalLink, Copy, Check, Search, Radio, Layers, 
  ChevronRight, Sparkles, X
} from 'lucide-react';
import Modal from '../components/Modal';
import { API_BASE, getLogoUrl } from '../config';

export default function Dashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('zones'); // 'zones' | 'all'
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/businesses`)
      .then(res => {
        setBusinesses(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching businesses:', err);
        setBusinesses([]);
        setLoading(false);
      });
  }, []);

  const confirmDelete = (business) => {
    setBusinessToDelete(business);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!businessToDelete) return;
    try {
      await axios.delete(`${API_BASE}/api/businesses/${businessToDelete.id}`);
      const currentList = Array.isArray(businesses) ? businesses : [];
      const updated = currentList.filter(b => b.id !== businessToDelete.id);
      setBusinesses(updated);
      setDeleteModalOpen(false);
      setBusinessToDelete(null);
      // Si la ciudad seleccionada se quedó sin terminales, volver a vista de zonas
      const remainingInCity = updated.filter(b => (b.city || 'Desconocida') === selectedCity);
      if (remainingInCity.length === 0) setSelectedCity(null);
    } catch (error) {
      console.error('Error eliminando negocio:', error);
      alert('Hubo un error al desvincular el nodo.');
    }
  };

  const copyQrLink = (business, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/qr/${business.qr_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(business.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtrado por búsqueda
  const filteredBusinesses = businesses.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.business_name || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.qr_token || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q)
    );
  });

  // Agrupación dinámica por ciudades para las carpetas
  const citiesData = businesses.reduce((acc, business) => {
    const city = business.city || 'Desconocida';
    if (!acc[city]) {
      acc[city] = { count: 0, items: [] };
    }
    acc[city].count += 1;
    acc[city].items.push(business);
    return acc;
  }, {});
  const cityEntries = Object.entries(citiesData).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ENCABEZADO PRINCIPAL */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
              <span className="radar-dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--color-accent)', fontWeight: '700', letterSpacing: '0.08em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Gestión de Flota &middot; Radar Activo
              </span>
            </div>
            <h1 className="text-gradient" style={{ margin: '0 0 6px 0', fontSize: '2.4rem', fontWeight: '800', lineHeight: '1.2' }}>
              Terminales de Red
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '600px' }}>
              Administra los nodos físicos enlazados, consulta sus códigos QR y mantén el control por zonas geográficas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/register')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: '600', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}
            >
              <Plus size={18} />
              Registrar Nuevo Nodo
            </button>
          </div>
        </div>

        {/* BARRA DE ESTADÍSTICAS RÁPIDAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div className="stat-card stat-card-nodes" style={{ borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <Radio size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Nodos Activos</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{businesses.length} <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>online</span></div>
            </div>
          </div>

          <div className="stat-card stat-card-zones" style={{ borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Zonas Desplegadas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{cityEntries.length} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>ciudades</span></div>
            </div>
          </div>

          <div className="stat-card stat-card-qr" style={{ borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Tokens QR</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>100% <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>enlazados</span></div>
            </div>
          </div>
        </div>

        {/* BARRA DE CONTROLES: BUSCADOR & MODOS DE VISTA */}
        <div className="terminal-controls-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '12px 16px', borderRadius: '16px' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '460px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por comercio, ciudad o token QR..."
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

          {/* Switch de modo de visualización */}
          {!searchQuery && (
            <div className="terminal-switch-container" style={{ display: 'flex', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => { setViewMode('zones'); setSelectedCity(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', border: 'none',
                  fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: viewMode === 'zones' && !selectedCity ? 'var(--color-accent)' : 'transparent',
                  color: viewMode === 'zones' && !selectedCity ? '#fff' : 'var(--color-text-secondary)'
                }}
              >
                <Folder size={16} />
                Por Zonas
              </button>
              <button
                onClick={() => { setViewMode('all'); setSelectedCity(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', border: 'none',
                  fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: viewMode === 'all' ? 'var(--color-accent)' : 'transparent',
                  color: viewMode === 'all' ? '#fff' : 'var(--color-text-secondary)'
                }}
              >
                <Layers size={16} />
                Ver Todos ({businesses.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ESTADO DE CARGA */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
          <div className="animate-spin" style={{ width: '44px', height: '44px', border: '3px solid rgba(6,182,212,0.15)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Escaneando nodos de la red...</span>
        </div>
      ) : businesses.length === 0 ? (
        /* ESTADO SIN NODOS */
        <div className="bento-card" style={{ textAlign: 'center', padding: '60px 24px', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
          <div className="glow-accent" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px', height: '220px' }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', padding: '22px', borderRadius: '50%', marginBottom: '20px' }}>
              <Radio size={46} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2 style={{ marginBottom: '8px', color: 'var(--color-text-primary)', fontSize: '1.5rem' }}>Red Sin Terminales Enlazadas</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', maxWidth: '420px', fontSize: '0.95rem' }}>
              No tienes terminales registradas en este momento. Vincula tu primer comercio para activar el monitoreo en tiempo real.
            </p>
            <button className="btn-primary" onClick={() => navigate('/register')} style={{ padding: '12px 28px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} />
              Registrar Primer Nodo
            </button>
          </div>
        </div>
      ) : searchQuery ? (
        /* VISTA FILTRADA POR BÚSQUEDA */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Resultados para "<strong style={{ color: 'var(--color-text-primary)' }}>{searchQuery}</strong>": {filteredBusinesses.length} terminal{filteredBusinesses.length !== 1 ? 'es' : ''} encontrada{filteredBusinesses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="bento-card" style={{ textAlign: 'center', padding: '50px 20px', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={40} style={{ color: 'var(--color-text-secondary)', marginBottom: '14px', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '6px' }}>Sin coincidencias</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                No encontramos terminales con el término especificado.
              </p>
              <button className="btn-secondary" onClick={() => setSearchQuery('')} style={{ borderRadius: '8px', padding: '8px 16px' }}>
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {filteredBusinesses.map(business => renderTerminalCard(business))}
            </div>
          )}
        </div>
      ) : viewMode === 'all' ? (
        /* VISTA DE TODAS LAS TERMINALES (PLANA) */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Mostrando todas las terminales desplegadas en la red:
            </span>
          </div>
          <div className="dashboard-grid">
            {businesses.map(business => renderTerminalCard(business))}
          </div>
        </div>
      ) : selectedCity === null ? (
        /* VISTA NIVEL 1: CARPETAS DE ZONAS POR CIUDAD */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={18} color="var(--color-accent)" />
              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>Zonas Geográficas Activas</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Selecciona una zona para desplegar sus terminales
            </span>
          </div>

          <div className="bento-grid">
            {cityEntries.map(([city, data]) => {
              const previewLogos = data.items.filter(i => i.logo_url).slice(0, 3);
              return (
                <div 
                  key={city} 
                  className="bento-card col-span-4 m-col-span-1 zone-folder-card" 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '24px',
                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }} 
                  onClick={() => setSelectedCity(city)}
                >
                  <div className="glow-accent" style={{ top: '-20px', right: '-20px', width: '130px', height: '130px', opacity: 0.12 }}></div>
                  
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    {/* Header de la Carpeta */}
                    <div className="zone-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div className="zone-icon-box" style={{ 
                        width: '52px', height: '52px', borderRadius: '14px', 
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                        border: '1px solid rgba(6,182,212,0.3)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px -4px rgba(6,182,212,0.25)'
                      }}>
                        <Folder size={28} color="var(--color-accent)" />
                      </div>
                      <span className="zone-badge" style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', 
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700'
                      }}>
                        <span className="radar-dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                        <span>ACTIVA</span>
                      </span>
                    </div>

                    {/* Nombre y Cantidad */}
                    <div className="zone-content" style={{ marginBottom: '20px' }}>
                      <h3 className="zone-title" style={{ margin: '0 0 6px 0', fontSize: '1.35rem', color: 'var(--color-text-primary)', fontWeight: '700' }}>
                        {city}
                      </h3>
                      <p className="zone-subtitle" style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {data.count} terminal{data.count !== 1 ? 'es' : ''}
                      </p>
                    </div>

                    {/* Previsualización de Nodos y Botón de Apertura */}
                    <div className="zone-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="avatar-stack">
                        {previewLogos.map((item, idx) => (
                          <img 
                            key={idx} 
                            src={getLogoUrl(item.logo_url)} 
                            alt="" 
                            className="avatar-stack-item"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo-icon-radar.png'; }}
                          />
                        ))}
                        {data.count > previewLogos.length && (
                          <div className="avatar-stack-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: '700' }}>
                            +{data.count - previewLogos.length}
                          </div>
                        )}
                      </div>

                      <div className="zone-arrow" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                        <span>Ver</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA NIVEL 2: TERMINALES DENTRO DE UNA ZONA SELECCIONADA */
        <div>
          {/* Breadcrumb y Barra de Retorno */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedCity(null)} 
                style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>Volver a Zonas</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                <span>Zonas</span>
                <span>/</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: '700', fontSize: '1.1rem' }}>{selectedCity}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: '600' }}>
              {businesses.filter(b => (b.city || 'Desconocida') === selectedCity).length} Terminales en esta zona
            </div>
          </div>

          <div className="dashboard-grid">
            {businesses
              .filter(b => (b.city || 'Desconocida') === selectedCity)
              .map(business => renderTerminalCard(business))}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA DESVINCULAR */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Desvincular Terminal de Red">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: '#ef4444', filter: 'blur(20px)', opacity: 0.25, borderRadius: '50%' }}></div>
            <AlertTriangle size={32} color="#ef4444" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <h3 style={{ marginBottom: '10px', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>¿Confirmas la baja del nodo?</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Estás a punto de desconectar a <strong style={{ color: 'var(--color-text-primary)' }}>{businessToDelete?.business_name}</strong> de NeXo Radar. 
            El token QR (<code style={{ color: 'var(--color-accent)' }}>{businessToDelete?.qr_token}</code>) quedará desvinculado. Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => setDeleteModalOpen(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px' }}>
              Cancelar
            </button>
            <button className="btn-danger" onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={16} />
              Confirmar Desvinculación
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );

  // FUNCIÓN PARA RENDERIZAR LA TARJETA DE CADA TERMINAL
  function renderTerminalCard(business) {
    const isCopied = copiedId === business.id;
    return (
      <div 
        key={business.id} 
        className="bento-card terminal-node-card" 
        style={{ 
          padding: 0, 
          display: 'flex', 
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        <div className="glow-accent" style={{ top: '-30px', left: '-30px', width: '120px', height: '120px', opacity: 0.12 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
          
          {/* Barra Superior del Nodo (Telemetría / ID) */}
          <div className="terminal-topbar" style={{ padding: '12px 18px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>NODO</span>
              <span style={{ fontFamily: 'monospace', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', border: '1px solid rgba(6,182,212,0.3)' }}>
                #{business.qr_token || '---'}
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span className="radar-dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {business.status || 'ONLINE'}
              </span>
            </div>
          </div>

          {/* Encabezado con Logo Ampliado y Título Legible */}
          <div className="terminal-header" style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {business.logo_url ? (
              <div className="terminal-logo-container" style={{ position: 'relative', width: '62px', height: '62px', flexShrink: 0 }}>
                <img 
                  src={getLogoUrl(business.logo_url)} 
                  alt={business.business_name} 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo-icon-radar.png'; }}
                  style={{ width: '62px', height: '62px', borderRadius: '16px', objectFit: 'cover', border: '2.5px solid rgba(6,182,212,0.4)', boxShadow: '0 6px 18px rgba(0,0,0,0.35)', display: 'block' }} 
                />
              </div>
            ) : (
              <div className="terminal-logo-container" style={{ width: '62px', height: '62px', borderRadius: '16px', background: 'rgba(6,182,212,0.12)', border: '1.5px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={30} color="var(--color-accent)" />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.15rem', color: 'var(--color-text-primary)', fontWeight: '700', lineHeight: '1.35', wordBreak: 'break-word' }}>
                {business.business_name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                <MapPin size={14} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                <span style={{ wordBreak: 'break-word' }}>{business.city || 'Ubicación no asignada'}</span>
              </div>
            </div>
          </div>
          
          {/* Cuerpo: Datos del Nodo Responsivos */}
          <div className="terminal-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="terminal-data-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(2, 6, 23, 0.45)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Phone size={14} color="var(--color-accent)" />
                Contacto
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)', fontWeight: '600', wordBreak: 'break-all' }}>
                {business.phone || 'Sin número'}
              </span>
            </div>

            <div className="terminal-data-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(2, 6, 23, 0.45)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <QrCode size={14} color="var(--color-accent)" />
                Token QR
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.92rem', color: 'var(--color-accent)', fontWeight: '700', letterSpacing: '1px', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.25)' }}>
                {business.qr_token}
              </span>
            </div>
          </div>

          {/* Acciones Rápidas con Botones Anclados y Mejor Estilo */}
          <div className="terminal-actions-footer" style={{ marginTop: 'auto', padding: '14px 18px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="terminal-btn-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Abrir Portal QR */}
              <a
                href={`/qr/${business.qr_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="terminal-btn-portal"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  height: '42px', padding: '0 12px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  color: 'var(--color-accent)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '10px',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(6,182,212,0.1)', whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.28)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(6, 182, 212, 0.08) 100%)'; e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)'; e.currentTarget.style.transform = 'none'; }}
              >
                <ExternalLink size={15} />
                <span>Portal QR</span>
              </a>

              {/* Copiar Link */}
              <button
                onClick={(e) => copyQrLink(business, e)}
                className="terminal-btn-copy"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  height: '42px', padding: '0 12px',
                  background: isCopied ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  color: isCopied ? '#10b981' : 'var(--color-text-secondary)',
                  border: isCopied ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { if (!isCopied) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--color-text-primary)'; } }}
                onMouseOut={(e) => { if (!isCopied) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
                title="Copiar URL del portal QR"
              >
                {isCopied ? <Check size={15} /> : <Copy size={15} />}
                <span>{isCopied ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>

            {/* Desvincular Nodo */}
            <button 
              onClick={() => confirmDelete(business)} 
              className="terminal-btn-delete"
              style={{ 
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', 
                height: '36px', padding: '0 12px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', 
                border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', cursor: 'pointer', 
                transition: 'all 0.2s ease', fontWeight: '600', fontSize: '0.8rem'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
            >
              <Trash2 size={14} />
              <span>Desvincular Nodo</span>
            </button>
          </div>

        </div>
      </div>
    );
  }
}
