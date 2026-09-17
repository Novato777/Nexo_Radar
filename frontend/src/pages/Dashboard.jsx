import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, MapPin, Phone, Trash2, Plus, QrCode, 
  AlertTriangle, ShieldCheck, Folder, ArrowLeft, 
  ExternalLink, Copy, Check, Search, Radio, Layers, 
  ChevronRight, Sparkles, X, Camera, Loader2, Edit3,
  Navigation, UploadCloud, User
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Modal from '../components/Modal';
import { API_BASE, getLogoUrl } from '../config';

// Icono personalizado para el picker en el modal de edición
const editPickerIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function EditLocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={editPickerIcon}></Marker>
  );
}

function EditMapController({ center }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true, duration: 0.6 });
      map.invalidateSize();
    }
  }, [center, map]);
// Función para normalizar nombres de ciudades (eliminar espacios extras, unificar mayúsculas y prevenir carpetas duplicadas)
export const normalizeCityName = (str) => {
  if (!str || typeof str !== 'string') return 'Desconocida';
  const clean = str.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Desconocida';
  return clean.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

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

  // Estado para cambio directo de foto/logo
  const fileInputRef = useRef(null);
  const [selectedBusinessForLogo, setSelectedBusinessForLogo] = useState(null);
  const [uploadingLogoId, setUploadingLogoId] = useState(null);

  // Estado para Modal de Edición Completa
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [editFormData, setEditFormData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    city: '',
    address: '',
    qr_token: ''
  });
  const [editPosition, setEditPosition] = useState(null);
  const [editMapCenter, setEditMapCenter] = useState([4.6097, -74.0817]);
  const [editFile, setEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const editFileInputRef = useRef(null);

  // Buscador de nueva dirección o ciudad en el modal de edición
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSuggestions, setEditSuggestions] = useState([]);
  const [editSearching, setEditSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (editSearchQuery.length > 2) {
        setEditSearching(true);
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=co&q=${encodeURIComponent(editSearchQuery)}`)
          .then(res => {
            setEditSuggestions(res.data);
            setEditSearching(false);
          })
          .catch(() => setEditSearching(false));
      } else {
        setEditSuggestions([]);
      }
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [editSearchQuery]);

  const handleSelectEditLocation = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setEditPosition({ lat, lng });
    setEditMapCenter([lat, lng]);
    setEditSearchQuery('');
    setEditSuggestions([]);
  };

  const openEditModal = (business, e) => {
    if (e) e.stopPropagation();
    setEditingBusiness(business);
    setEditFormData({
      business_name: business.business_name || '',
      owner_name: business.owner_name || '',
      phone: business.phone || '',
      city: business.city || '',
      address: business.address || '',
      qr_token: business.qr_token || ''
    });

    const lat = business.latitude ? parseFloat(business.latitude) : null;
    const lng = business.longitude ? parseFloat(business.longitude) : null;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      setEditPosition({ lat, lng });
      setEditMapCenter([lat, lng]);
    } else {
      setEditPosition(null);
      setEditMapCenter([4.6097, -74.0817]);
    }

    setEditFile(null);
    setEditPreviewUrl(business.logo_url ? getLogoUrl(business.logo_url) : null);
    setEditError('');
    setEditSearchQuery('');
    setEditSuggestions([]);
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setEditFile(selected);
      setEditPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleUseCurrentLocationForEdit = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setEditPosition(coords);
        setEditMapCenter([coords.lat, coords.lng]);
      },
      (err) => console.debug('GPS error:', err),
      { enableHighAccuracy: true }
    );
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBusiness) return;
    setEditSaving(true);
    setEditError('');

    try {
      let res;
      if (editFile) {
        // Con imagen nueva: Usamos FormData sin cabeceras manuales para preservar el boundary de multer
        const data = new FormData();
        Object.keys(editFormData).forEach(key => {
          if (editFormData[key] !== undefined && editFormData[key] !== null) {
            data.append(key, editFormData[key]);
          }
        });
        data.append('logo', editFile);
        if (editPosition) {
          data.append('latitude', editPosition.lat);
          data.append('longitude', editPosition.lng);
        }
        res = await axios.put(`${API_BASE}/api/businesses/${editingBusiness.id}`, data);
      } else {
        // Sin imagen nueva: Enviamos JSON directo (más rápido, seguro y sin problemas de boundary multipart)
        const payload = {
          ...editFormData,
          latitude: editPosition ? editPosition.lat : null,
          longitude: editPosition ? editPosition.lng : null
        };
        res = await axios.put(`${API_BASE}/api/businesses/${editingBusiness.id}`, payload);
      }

      const updated = res.data?.business || (res.data?.id ? res.data : null);
      if (updated) {
        setBusinesses(prev => prev.map(b => b.id === editingBusiness.id ? { ...b, ...updated } : b));
        setEditModalOpen(false);
        setEditingBusiness(null);
        setEditFile(null);
      } else {
        // Si por alguna razón la respuesta no trajo objeto pero fue exitosa, refrescar lista
        const ref = await axios.get(`${API_BASE}/api/businesses`);
        if (Array.isArray(ref.data)) setBusinesses(ref.data);
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error al actualizar negocio:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setEditError(serverMsg || 'Error al actualizar los datos del negocio.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenLogoPicker = (business, e) => {
    e.stopPropagation();
    setSelectedBusinessForLogo(business);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBusinessForLogo) return;

    setUploadingLogoId(selectedBusinessForLogo.id);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await axios.patch(`${API_BASE}/api/businesses/${selectedBusinessForLogo.id}/logo`, formData);
      const updated = res.data?.business || (res.data?.id ? res.data : null);
      if (updated) {
        setBusinesses(prev => prev.map(b => b.id === selectedBusinessForLogo.id ? { ...b, ...updated } : b));
      }
    } catch (err) {
      console.error('Error actualizando logo:', err);
      alert(err.response?.data?.error || 'Error al actualizar el logotipo del negocio');
    } finally {
      setUploadingLogoId(null);
      setSelectedBusinessForLogo(null);
    }
  };

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
      const remainingInCity = updated.filter(b => normalizeCityName(b.city) === selectedCity);
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

  // Agrupación dinámica por ciudades para las carpetas (con normalización para evitar duplicados)
  const citiesData = businesses.reduce((acc, business) => {
    const city = normalizeCityName(business.city);
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
              {businesses.filter(b => normalizeCityName(b.city) === selectedCity).length} Terminales en esta zona
            </div>
          </div>

          <div className="dashboard-grid">
            {businesses
              .filter(b => normalizeCityName(b.city) === selectedCity)
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

      {/* MODAL: EDITAR INFORMACIÓN COMPLETA DEL NODO */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => !editSaving && setEditModalOpen(false)} 
        title={`Editar Nodo: ${editingBusiness?.business_name || 'Comercio'}`}
        maxWidth="720px"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          
          {editError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
              {editError}
            </div>
          )}

          {/* Subir / Cambiar Logo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Logotipo / Foto del Comercio
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                onClick={() => editFileInputRef.current?.click()}
                style={{
                  width: '80px', height: '80px', borderRadius: '16px', border: '2px dashed var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  background: 'rgba(6, 182, 212, 0.05)', overflow: 'hidden', position: 'relative'
                }}
              >
                {editPreviewUrl ? (
                  <img src={editPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UploadCloud size={24} color="var(--color-accent)" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => editFileInputRef.current?.click()}
                  style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}
                >
                  <Camera size={14} />
                  <span>{editPreviewUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                </button>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Formatos PNG, JPG o WEBP. Se optimizará y guardará en Cloudinary CDN.
                </p>
                <input 
                  type="file" 
                  ref={editFileInputRef} 
                  onChange={handleEditFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>
          </div>

          {/* Campos en dos columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Nombre del Comercio *
              </label>
              <input 
                type="text" 
                name="business_name" 
                required 
                className="input-styled" 
                value={editFormData.business_name} 
                onChange={handleEditChange} 
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Propietario / Contacto
              </label>
              <input 
                type="text" 
                name="owner_name" 
                className="input-styled" 
                value={editFormData.owner_name} 
                onChange={handleEditChange} 
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Teléfono WhatsApp *
              </label>
              <input 
                type="text" 
                name="phone" 
                required 
                className="input-styled" 
                value={editFormData.phone} 
                onChange={handleEditChange} 
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Código Token QR *
              </label>
              <input 
                type="text" 
                name="qr_token" 
                required 
                className="input-styled" 
                value={editFormData.qr_token} 
                onChange={handleEditChange} 
                style={{ width: '100%', height: '40px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-accent)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Ciudad / Municipio *
              </label>
              <input 
                type="text" 
                name="city" 
                required 
                className="input-styled" 
                value={editFormData.city} 
                onChange={handleEditChange} 
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Dirección Física
              </label>
              <input 
                type="text" 
                name="address" 
                className="input-styled" 
                value={editFormData.address} 
                onChange={handleEditChange} 
                style={{ width: '100%', height: '40px' }}
              />
            </div>
          </div>

          {/* Selector de Mapa GPS con Reubicación Dinámica */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Ubicación Satelital (Radar GPS)
                </label>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                  Haz clic sobre el mapa en la nueva dirección para mover el pin GPS.
                </p>
              </div>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleUseCurrentLocationForEdit}
                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-accent)', border: '1px solid rgba(6, 182, 212, 0.3)' }}
              >
                <Navigation size={13} />
                <span>Usar Mi GPS Actual</span>
              </button>
            </div>

            {/* Buscador de dirección rápida para centrar el mapa */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input 
                type="text"
                placeholder="Buscar nueva dirección o ciudad para mover el mapa..."
                value={editSearchQuery}
                onChange={(e) => setEditSearchQuery(e.target.value)}
                className="input-styled"
                style={{ width: '100%', height: '36px', paddingLeft: '34px', fontSize: '0.82rem' }}
              />
              {editSearching && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />}

              {editSuggestions.length > 0 && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                  background: '#0f172a', border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px', listStyle: 'none', margin: '4px 0 0', padding: '6px 0',
                  maxHeight: '160px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {editSuggestions.map((sug, idx) => (
                    <li 
                      key={idx}
                      onClick={() => handleSelectEditLocation(sug)}
                      style={{ padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-text-primary)' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(6,182,212,0.15)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      📍 {sug.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(6, 182, 212, 0.35)', position: 'relative' }}>
              <MapContainer 
                center={editMapCenter} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <EditLocationPicker position={editPosition} setPosition={setEditPosition} />
                <EditMapController center={editMapCenter} />
              </MapContainer>
            </div>

            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(2, 6, 23, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ color: editPosition ? '#10b981' : '#f87171', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} />
                {editPosition 
                  ? `Coordenadas fijadas: ${editPosition.lat.toFixed(6)}, ${editPosition.lng.toFixed(6)}`
                  : '⚠️ Sin coordenadas. Haz clic en el mapa para marcar la nueva ubicación.'}
              </span>
              <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>
                📌 Haz clic en el mapa para mover el pin
              </span>
            </div>
          </div>

          {/* Botones de acción del Modal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setEditModalOpen(false)}
              disabled={editSaving}
              style={{ padding: '10px 18px', borderRadius: '10px' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={editSaving}
              style={{ padding: '10px 22px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}
            >
              {editSaving && <Loader2 size={16} className="animate-spin" />}
              <span>{editSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* Input oculto para subir nueva foto a comercios existentes */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

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
            <div 
              className="terminal-logo-container" 
              style={{ position: 'relative', width: '62px', height: '62px', flexShrink: 0, cursor: 'pointer' }}
              onClick={(e) => handleOpenLogoPicker(business, e)}
              title="Haz clic para cambiar o subir foto a Cloudinary"
            >
              {business.logo_url ? (
                <img 
                  src={getLogoUrl(business.logo_url)} 
                  alt={business.business_name} 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo-icon-radar.png'; }}
                  style={{ width: '62px', height: '62px', borderRadius: '16px', objectFit: 'cover', border: '2.5px solid rgba(6,182,212,0.4)', boxShadow: '0 6px 18px rgba(0,0,0,0.35)', display: 'block' }} 
                />
              ) : (
                <div style={{ width: '62px', height: '62px', borderRadius: '16px', background: 'rgba(6,182,212,0.12)', border: '1.5px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={30} color="var(--color-accent)" />
                </div>
              )}

              {/* Botón flotante para cambiar foto */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--color-accent, #06b6d4)',
                  color: '#020617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  border: '2px solid #0f172a'
                }}
              >
                {uploadingLogoId === business.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </div>
            </div>

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
            
            {/* Fila 1: Botones de Gestión (Editar y Ver en Radar) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={(e) => openEditModal(business, e)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  height: '38px', padding: '0 10px',
                  background: 'rgba(6, 182, 212, 0.12)', color: 'var(--color-accent)',
                  border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '0.84rem', fontWeight: '700',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'; e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)'; }}
                title="Editar información, foto y ubicación GPS"
              >
                <Edit3 size={15} />
                <span>Editar Nodo</span>
              </button>

              <button
                onClick={() => navigate(`/mapa?focus=${business.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  height: '38px', padding: '0 10px',
                  background: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-primary)',
                  border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '0.84rem', fontWeight: '600',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                title="Localizar en el radar satelital en vivo"
              >
                <Navigation size={14} color="var(--color-accent)" />
                <span>Ver en Radar</span>
              </button>
            </div>

            {/* Fila 2: Portal QR y Copiar URL */}
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
