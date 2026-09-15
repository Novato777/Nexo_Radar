import React from 'react';
import { ShieldAlert, RefreshCw, Home, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NeXo Radar - Error Crítico Capturado por Escudo]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          minHeight: '100dvh',
          backgroundColor: '#020617',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#0f172a',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Barra superior de acento */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #06b6d4)'
            }} />

            {/* Logo NeXo Radar */}
            <img 
              src="/logo-nexo-radar-dark.png" 
              alt="NeXo Radar" 
              style={{ height: '42px', margin: '0 auto 20px', display: 'block', objectFit: 'contain' }} 
            />

            {/* Icono de Escudo */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#06b6d4'
            }}>
              <ShieldAlert size={32} />
            </div>

            <div style={{
              display: 'inline-block',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              Escudo de Estabilidad Activo
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: '#f8fafc' }}>
              Interrupción Temporal del Módulo
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '24px' }}>
              Se detectó una discrepancia en el renderizado o en la sincronización de datos. El escudo de NeXo Radar contuvo el error para evitar la desconexión del sistema.
            </p>

            {/* Botones de Recuperación */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#06b6d4',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
                }}
              >
                <RefreshCw size={18} />
                <span>Restaurar Módulo</span>
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Home size={18} />
                <span>Ir al Dashboard</span>
              </button>
            </div>

            {/* Desplegable de Diagnóstico Técnico */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginTop: '14px' }}>
              <button
                onClick={this.toggleDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '500'
                }}
              >
                <Terminal size={14} />
                <span>{this.state.showDetails ? 'Ocultar diagnóstico técnico' : 'Ver diagnóstico técnico'}</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div style={{
                  marginTop: '12px',
                  textAlign: 'left',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  fontFamily: 'monospace',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid rgba(239,68,68,0.2)'
                }}>
                  <strong>Error:</strong> {this.state.error?.toString()}
                  <br />
                  <br />
                  <span style={{ color: '#94a3b8' }}>{this.state.errorInfo?.componentStack}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
