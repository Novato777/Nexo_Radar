import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Loader2, Eye, EyeOff, ShieldCheck, Zap, Globe } from 'lucide-react';
import { API_BASE } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // El módulo de Login se mantiene estrictamente en modo oscuro de alta concentración
    document.documentElement.removeAttribute('data-theme');
    
    // Si ya existe sesión activa, redirigir automáticamente al centro de mando
    const token = localStorage.getItem('nexo_auth');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor completa tu usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE}/api/login`, {
        username: username.trim(),
        password
      });

      if (res.data && res.data.success) {
        localStorage.setItem('nexo_auth', res.data.token);
        if (res.data.user) {
          localStorage.setItem('nexo_user', JSON.stringify(res.data.user));
        } else {
          // Fallback por defecto si no viniera el payload de usuario
          localStorage.setItem('nexo_user', JSON.stringify({
            name: username,
            role: 'superadmin'
          }));
        }

        // Solicitar permisos de geolocalización de inmediato en nuevos dispositivos (PC y Android)
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              try {
                localStorage.setItem('nexo_user_location', JSON.stringify({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  timestamp: Date.now()
                }));
              } catch {}
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          );
        }

        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Usuario o contraseña incorrectos. Verifica tus datos.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      minHeight: '100dvh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Brillo ambiental de fondo */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '320px',
        height: '320px',
        background: 'rgba(6, 182, 212, 0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <div 
        className="premium-card" 
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          padding: '36px 32px',
          borderRadius: '20px',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 25px rgba(6, 182, 212, 0.1)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Encabezado con Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img 
            src="/logo-nexo-radar-dark.png" 
            alt="NeXo Radar" 
            style={{ height: '46px', margin: '0 auto 14px', display: 'block', objectFit: 'contain' }} 
          />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '4px 12px', borderRadius: '16px', marginBottom: '10px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }}></span>
            <span style={{ color: '#06b6d4', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Centro de Operaciones</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Ingresa con tu cuenta de colaborador o administrador
          </p>
        </div>

        <form onSubmit={handleLogin}>
          
          {/* Campo Usuario / Correo */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Usuario o Correo
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} 
              />
              <input
                type="text"
                placeholder="ej: admin@nexoradar.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#06b6d4'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 44px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#06b6d4'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f87171',
              marginBottom: '18px',
              fontSize: '0.85rem',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '0.95rem',
              fontWeight: '700',
              letterSpacing: '0.03em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>AUTENTICANDO...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>INGRESAR AL SISTEMA</span>
              </>
            )}
          </button>

          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="btn-secondary" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '0.9rem',
              fontWeight: '600',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '10px',
              cursor: 'pointer'
            }} 
          >
            <Globe size={18} color="var(--color-accent)" />
            <span>Sitio Web</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
            NeXo Radar v2.0 • Conexión Cifrada y Monitoreada
          </p>
        </div>
      </div>
    </div>
  );
}
