import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, QrCode, Save, Loader2, MapPin, Search, 
  AlertCircle, Building2, User, Phone, Image, UploadCloud, CheckCircle2 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import Modal from '../components/Modal';
import axios from 'axios';
import L from 'leaflet';
import { API_BASE } from '../config';

// Icono personalizado para el picker
const pickerIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={pickerIcon}></Marker>
  );
}

// Componente para mover el mapa programáticamente
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13, { animate: true, duration: 0.6 });
    }
  }, [center, map]);
  return null;
}

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([4.6097, -74.0817]); // Default Bogotá
  
  // Estado para Modal de Error
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    city: '',
    address: '',
    qr_token: ''
  });

  // Si venimos de un escaneo de QR físico no asignado (ej: /register?qr=001)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qrParam = params.get('qr');
    if (qrParam) {
      setFormData(prev => ({ ...prev, qr_token: qrParam.trim() }));
    }
  }, [location.search]);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
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
    const cityName = cityData.display_name.split(',')[0];
    
    setFormData({ ...formData, city: cityName });
    setMapCenter([lat, lon]);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('logo', file);
    if (position) {
      data.append('latitude', position.lat);
      data.append('longitude', position.lng);
    }

    try {
      await axios.post(`${API_BASE}/api/businesses`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/terminales');
    } catch (error) {
      console.error('Error registrando negocio:', error);
      const serverMsg = error.response?.data?.error;
      setErrorMessage(serverMsg || 'El token QR ingresado podría estar duplicado o ya asignado a otro comercio registrado. Verifica el código e intenta nuevamente.');
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* Barra de Navegación Superior / Retorno */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button 
          className="btn-secondary" 
          onClick={() => navigate(-1)} 
          style={{ padding: '8px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Volver a Terminales</span>
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Configuración de Nodo
        </span>
      </div>

      <div className="bento-card" style={{ padding: '28px' }}>
        
        {/* Encabezado del Formulario */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: '18px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '3px 10px', borderRadius: '16px', marginBottom: '10px' }}>
            <span className="radar-dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nuevo Despliegue</span>
          </div>
          <h1 className="text-gradient" style={{ margin: '0 0 6px 0', fontSize: '2rem', fontWeight: '800', lineHeight: 1.2 }}>
            Registrar Nuevo Nodo
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Completa la ficha técnica del comercio, asigna el código QR impreso y ubícalo en el radar satelital.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* UPLOAD LOGO / FOTO DEL COMERCIO */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Identidad Visual del Comercio (Logo / Foto)
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />

            <div 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{ 
                border: '2px dashed rgba(6, 182, 212, 0.3)', 
                borderRadius: '16px', 
                padding: '20px', 
                textAlign: 'center', 
                cursor: 'pointer',
                background: 'var(--color-bg)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.currentTarget.style.background = 'var(--color-bg)'; }}
            >
              {previewUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <img 
                    src={previewUrl} 
                    alt="Vista previa" 
                    style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', border: '2px solid var(--color-accent)' }} 
                  />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>{file?.name}</p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>Haz clic para cambiar imagen</span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', fontWeight: '600', display: 'block' }}>
                      Cargar foto o logotipo
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      Toca aquí para seleccionar una imagen (JPG, PNG)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DATOS BÁSICOS DEL COMERCIO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Building2 size={14} color="var(--color-accent)" />
                Nombre del Negocio *
              </label>
              <input 
                required 
                name="business_name" 
                value={formData.business_name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Ej. Barbería El Maestro" 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <User size={14} color="var(--color-accent)" />
                Dueño o Encargado
              </label>
              <input 
                name="owner_name" 
                value={formData.owner_name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Ej. Brayan Cardozo" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Phone size={14} color="var(--color-accent)" />
                Teléfono de Contacto
              </label>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Ej. 320 611 1216" 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <MapPin size={14} color="var(--color-accent)" />
                Ciudad / Municipio *
              </label>
              <input 
                required 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Ej. La Dorada, Caldas" 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dirección Completa
            </label>
            <input 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Ej. Calle 15 # 4-22 Barrio Centro" 
            />
          </div>

          {/* BUSCADOR DE CIUDADES EN EL MAPA */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Search size={14} color="var(--color-accent)" />
              Centrar Mapa en Ciudad
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingRight: '40px' }} 
                placeholder="Escribe el nombre de la ciudad (Ej. La Dorada, Honda, Ibagué...)" 
              />
              {searching && (
                <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />
              )}
            </div>

            {/* Dropdown de Sugerencias */}
            {suggestions.length > 0 && (
              <ul style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: '12px', listStyle: 'none', padding: 0, margin: 0, zIndex: 1000, maxHeight: '220px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                {suggestions.map((sug, idx) => (
                  <li 
                    key={idx} 
                    onClick={() => handleSelectCity(sug)}
                    style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-text-primary)' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {sug.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* MAP PICKER DE GEOLOCALIZACIÓN */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <MapPin size={14} color="var(--color-accent)" />
                Ubicación Satelital Exacta
              </label>

              {position && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700' }}>
                  <CheckCircle2 size={12} />
                  Fijado: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
              Toca sobre el mapa para colocar el pin de coordenadas exacto donde opera el negocio.
            </p>

            <div style={{ height: '240px', width: '100%', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 1 }}>
              <MapContainer center={mapCenter} zoom={13} maxZoom={21} zoomSnap={0.5} touchZoom={true} style={{ height: '100%', width: '100%' }} className="dark-map">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  maxNativeZoom={19}
                  maxZoom={21}
                />
                <LocationPicker position={position} setPosition={setPosition} />
                <MapController center={mapCenter} />
              </MapContainer>
            </div>
          </div>

          {/* ASIGNACIÓN DE CÓDIGO QR */}
          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.88rem', color: 'var(--color-accent)', fontWeight: '700' }}>
              <QrCode size={18} />
              Código Token de la Tarjeta QR *
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Ingresa el identificador único impreso en el material físico que le entregarás a este comercio (Ej. 001, 002, 1010).
            </p>
            <input 
              required 
              name="qr_token" 
              value={formData.qr_token} 
              onChange={handleChange} 
              className="form-input" 
              style={{ fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '2px', fontWeight: '700', textTransform: 'uppercase', background: 'var(--color-bg)' }} 
              placeholder="Ej. 003" 
            />
          </div>

          {/* BOTÓN DE GUARDADO / REGISTRO */}
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '15px', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(6,182,212,0.3)' }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Desplegando Nodo...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Guardar y Enlazar Nodo</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* MODAL DE ERROR */}
      <Modal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} title="Error al Registrar Nodo">
        <div style={{ textAlign: 'center', padding: '14px 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={32} color="#ef4444" />
          </div>
          <h3 style={{ marginBottom: '10px', fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>No se pudo enlazar la terminal</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {errorMessage || 'El token QR ingresado podría estar duplicado o ya asignado a otro comercio registrado. Verifica el código e intenta nuevamente.'}
          </p>
          <button className="btn-secondary" onClick={() => setErrorModalOpen(false)} style={{ width: '100%', padding: '12px', borderRadius: '10px' }}>
            Revisar Código QR
          </button>
        </div>
      </Modal>

    </div>
  );
}
