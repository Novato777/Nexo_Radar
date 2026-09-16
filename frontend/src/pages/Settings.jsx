import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Clock, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export default function Settings() {
  const [timeoutValue, setTimeoutValue] = useState('2700000'); // 45 minutos por defecto
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
    <div style={{
      padding: '40px 24px',
      minHeight: 'calc(100vh - 70px)',
      background: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.05), transparent 400px), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.05), transparent 400px)',
      color: 'var(--color-text-primary)'
    }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        {/* Encabezado Premium */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05))',
            padding: '12px',
            borderRadius: '14px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)'
          }}>
            <SettingsIcon size={32} color="var(--color-accent)" style={{ animation: 'spin-slow 10s linear infinite' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Configuración de Cuenta
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Administra tus preferencias personales y de seguridad local para este dispositivo.
            </p>
          </div>
        </div>

        {/* Tarjeta de Seguridad (Glassmorphism) */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Brillo de fondo sutil */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <ShieldCheck size={24} color="#10b981" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc' }}>Seguridad y Sesión Local</h2>
          </div>

          <div style={{ marginBottom: '32px', maxWidth: '600px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '10px' }}>
              <Clock size={18} color="var(--color-accent)" />
              Tiempo máximo de sesión inactiva (Auto-cierre)
            </label>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Selecciona el tiempo de inactividad permitido antes de que el sistema cierre tu sesión por seguridad. 
              <strong style={{ color: 'var(--color-accent)', fontWeight: '500' }}> Este ajuste es personal y solo aplica para tu usuario en este dispositivo</strong>, sin afectar a los demás colaboradores.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px' }}>
              <select 
                value={timeoutValue}
                onChange={(e) => setTimeoutValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#f8fafc',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2306b6d4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 20px top 50%',
                  backgroundSize: '14px auto'
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
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
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#ef4444' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', lineHeight: 1.4 }}>
                    <strong>Atención:</strong> La sesión permanente puede representar un riesgo de seguridad si este dispositivo es compartido. Úsalo solo en tu equipo personal.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleSave}
              className="btn-primary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '12px',
                boxShadow: saveSuccess ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : '0 4px 14px rgba(6, 182, 212, 0.3)',
                background: saveSuccess ? '#10b981' : 'var(--color-accent)',
                color: '#fff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Save size={20} />
              {saveSuccess ? '¡Ajustes Guardados!' : 'Guardar Cambios'}
            </button>
            
            {saveSuccess && (
              <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s ease' }}>
                <ShieldCheck size={16} /> Aplicado localmente
              </span>
            )}
          </div>
        </div>

        {/* Tarjeta de Información extra sutil */}
        <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={20} color="var(--color-text-secondary)" />
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Esta configuración solo aplica para el navegador actual. Si usas NeXo Radar en otro celular o computadora, deberás configurarlo allí también.
          </p>
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
    </div>
  );
}
