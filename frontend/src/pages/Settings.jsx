import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [timeoutValue, setTimeoutValue] = useState('2700000'); // 45 minutos por defecto (2700000 ms)
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nexo_session_timeout');
    if (saved !== null) {
      setTimeoutValue(saved);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('nexo_session_timeout', timeoutValue);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: 'var(--color-text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <SettingsIcon size={28} color="var(--color-accent)" />
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Configuración</h1>
      </div>

      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
          <ShieldCheck size={20} color="#10b981" />
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Seguridad y Sesión</h2>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            <Clock size={16} />
            Tiempo máximo de sesión inactiva (auto-cierre)
          </label>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Selecciona el tiempo que el sistema esperará antes de cerrar tu sesión automáticamente por inactividad. 
            Si eliges "Sesión Permanente", tu sesión nunca se cerrará sola. Este ajuste solo aplica a este dispositivo.
          </p>

          <select 
            value={timeoutValue}
            onChange={(e) => setTimeoutValue(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--color-text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2306b6d4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px top 50%',
              backgroundSize: '12px auto'
            }}
          >
            <option value="900000">15 minutos</option>
            <option value="1800000">30 minutos</option>
            <option value="2700000">45 minutos (Recomendado)</option>
            <option value="3600000">1 hora</option>
            <option value="28800000">8 horas</option>
            <option value="86400000">24 horas</option>
            <option value="0">Sesión Permanente (Nunca cerrar)</option>
          </select>
          
          {timeoutValue === '0' && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.82rem', fontWeight: '600' }}>
              <AlertCircle size={16} />
              <span>Atención: Sesión permanente puede representar un riesgo si el dispositivo es compartido.</span>
            </div>
          )}
        </div>

        <button 
          onClick={handleSave}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
        >
          <Save size={18} />
          {saveSuccess ? '¡Guardado con éxito!' : 'Guardar Cambios'}
        </button>

      </div>
    </div>
  );
}
