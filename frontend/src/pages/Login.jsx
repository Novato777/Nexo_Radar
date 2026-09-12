import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Radar, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // El módulo de Login se mantiene estrictamente en modo oscuro
    document.documentElement.removeAttribute('data-theme');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/login', { password });
      if (res.data.success) {
        localStorage.setItem('nexo_auth', res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError('Contraseña incorrecta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="premium-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <img 
          src="/logo-nexo-radar-dark.png" 
          alt="NeXo Radar" 
          style={{ height: '48px', margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} 
        />
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Acceso restringido para el equipo</p>

        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="password"
              placeholder="Contraseña Maestra"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              required
            />
          </div>
          
          {error && <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</p>}
          
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'ENTRAR AL SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
}
