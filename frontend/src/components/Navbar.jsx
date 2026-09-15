import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map, BellRing, LogOut, ShieldCheck, 
  Server, Sun, Moon, Database, Users, Shield 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNewAlerts, newAlertsCount, clearNewAlertsDot } = useSocket() || {};

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexo_theme') || 'dark';
  });

  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('nexo_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = useMemo(() => {
    if (!currentUser) return true; // Si no hay usuario en cache, permitir por defecto
    const role = (currentUser.role || '').toLowerCase();
    return role === 'admin' || role === 'superadmin';
  }, [currentUser]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Si el usuario navega a /alertas, limpiar el puntito amarillo
  useEffect(() => {
    if (location.pathname === '/alertas' && clearNewAlertsDot) {
      clearNewAlertsDot();
    }
  }, [location.pathname, clearNewAlertsDot]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('nexo_theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexo_auth');
    localStorage.removeItem('nexo_user');
    navigate('/login');
  };

  const NavItem = ({ path, icon: Icon, label, mobileLabel }) => {
    const isActive = location.pathname === path;
    const isAlertItem = path === '/alertas';

    const handleClick = () => {
      if (isAlertItem && clearNewAlertsDot) {
        clearNewAlertsDot();
      }
      navigate(path);
    };

    return (
      <button 
        className={`nav-item-btn ${isActive ? 'active' : ''}`}
        onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          border: isActive ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontWeight: isActive ? '600' : '400'
        }}
        onMouseOver={e => !isActive && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
        onMouseOut={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
          <Icon size={20} />
          {/* Puntito amarillo pulsante en Android y móvil (únicamente el punto) */}
          {isAlertItem && hasNewAlerts && (
            <span 
              className="alert-yellow-pulse-dot" 
              title={newAlertsCount > 0 ? `${newAlertsCount} señal(es) de alerta nueva(s)` : 'Alerta recibida'}
            />
          )}
        </div>
        <span className="nav-label nav-label-desktop">
          {label}
        </span>
        <span className="nav-label nav-label-mobile">{mobileLabel || label}</span>
      </button>
    );
  };

  return (
    <>
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <img 
            src={theme === 'dark' ? '/logo-nexo-radar-dark.png' : '/logo-nexo-radar.png'} 
            alt="NeXo Radar" 
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        {/* Navigation Links (Módulos Principales) */}
        <div className="navbar-links">
          <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem path="/terminales" icon={Server} label="Terminales" />
          <NavItem path="/mapa" icon={Map} label="Mapa" />
          <NavItem path="/alertas" icon={BellRing} label="Alertas" />
          {isAdmin && <NavItem path="/base-de-datos" icon={Database} label="Base de Datos" mobileLabel="DB" />}
          {isAdmin && <NavItem path="/colaboradores" icon={Users} label="Colaboradores" mobileLabel="Equipo" />}
        </div>

        {/* Barra sutil separadora entre los módulos y los botones de funcionalidad */}
        <div className="navbar-divider"></div>

        {/* User Actions: Modo Oscuro/Claro al lado del botón de Salir */}
        <div className="navbar-actions">
          
          {/* Insignia de Usuario Actual en Escritorio */}
          {currentUser && (
            <div className="user-badge-desktop" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: isAdmin ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 182, 212, 0.1)',
              border: `1px solid ${isAdmin ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.25)'}`,
              fontSize: '0.78rem',
              color: isAdmin ? '#f59e0b' : 'var(--color-accent)',
              fontWeight: '600',
              marginRight: '6px'
            }}>
              {isAdmin ? <Shield size={13} /> : <Users size={13} />}
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name || 'Usuario'}
              </span>
            </div>
          )}

          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <div className="nav-icon-wrapper">
              {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="var(--color-accent)" />}
            </div>
            <span className="nav-label">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button 
            className="logout-btn"
            onClick={handleLogout}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            title="Cerrar sesión"
          >
            <div className="nav-icon-wrapper">
              <LogOut size={20} />
            </div>
            <span className="nav-label">Salir</span>
          </button>
        </div>
      </div>

      <style>
        {`
          .navbar-container {
            height: 70px;
            background: var(--color-surface);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .navbar-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          }
          
          .brand-text {
            font-size: 1.2rem;
            color: var(--color-text-primary);
            font-weight: 800;
            letter-spacing: 0.05em;
          }

          .navbar-links {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .nav-item-btn {
            padding: 8px 16px;
            border-radius: 8px;
          }

          .nav-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            position: relative;
          }

          /* Puntito amarillo pulsante y radiante para la notificación de alerta */
          .alert-yellow-pulse-dot {
            position: absolute;
            top: -3px;
            right: -3px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #f59e0b;
            border: 2px solid var(--color-surface, #0f172a);
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.95);
            animation: alertDotPulse 1.5s infinite ease-in-out;
            z-index: 30;
            display: inline-block;
            pointer-events: none;
          }

          @keyframes alertDotPulse {
            0% {
              transform: scale(0.9);
              box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.85), 0 0 8px #f59e0b;
            }
            60% {
              transform: scale(1.2);
              box-shadow: 0 0 0 7px rgba(245, 158, 11, 0), 0 0 14px #f59e0b;
            }
            100% {
              transform: scale(0.9);
              box-shadow: 0 0 0 0 rgba(245, 158, 11, 0), 0 0 8px #f59e0b;
            }
          }



          .navbar-divider {
            display: none; /* Oculto en escritorio */
          }

          .navbar-actions {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .logout-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            color: var(--color-text-secondary);
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .nav-label-mobile {
            display: none;
          }
          .nav-label-desktop {
            display: inline-block;
          }

          /* Mobile / Bottom Tab Bar con espaciado equitativo y soporte de safe area en Android */
          @media (max-width: 768px) {
            .navbar-container {
              position: fixed;
              bottom: 0;
              top: auto;
              left: 0;
              right: 0;
              height: calc(65px + env(safe-area-inset-bottom, 0px));
              padding: 0 6px env(safe-area-inset-bottom, 0px) 6px;
              border-bottom: none;
              border-top: 1px solid rgba(255,255,255,0.08);
              box-shadow: 0 -4px 14px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-sizing: border-box;
            }
            
            .navbar-brand, .user-badge-desktop {
              display: none !important;
            }
            
            /* Contenedor de Módulos con scroll táctil invisible limitado hasta la barra divisoria */
            .navbar-links {
              display: flex;
              align-items: center;
              flex: 1;
              min-width: 0;
              gap: 6px;
              height: 100%;
              margin: 0;
              padding: 0 4px;
              overflow-x: auto;
              overflow-y: hidden;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none; /* Firefox invisible */
              -ms-overflow-style: none; /* IE/Edge */
            }

            .navbar-links::-webkit-scrollbar {
              display: none !important; /* Chrome, Safari, Android WebView */
              width: 0 !important;
              height: 0 !important;
            }

            /* Barra sutil divisoria fija entre módulos y botones de funcionalidad */
            .navbar-divider {
              display: block;
              width: 1px;
              height: 28px;
              background: rgba(255, 255, 255, 0.16);
              margin: 0 6px;
              flex-shrink: 0;
              border-radius: 1px;
              align-self: center;
            }

            [data-theme="light"] .navbar-divider {
              background: rgba(0, 0, 0, 0.14);
            }
            
            /* Botones de acción fijos a la derecha (Claro/Oscuro y Salir) */
            .navbar-actions {
              display: flex;
              align-items: center;
              flex-shrink: 0;
              gap: 4px;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            
            /* Botones de módulos con separación cómoda para evitar que se amontonen */
            .navbar-links .nav-item-btn {
              flex: 0 0 auto !important;
              min-width: 66px !important;
              width: auto !important;
              height: 52px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 4px 8px !important;
              gap: 3px !important;
              border-radius: 10px !important;
              background: transparent !important;
              border: 1px solid transparent !important;
              box-sizing: border-box;
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
            }

            /* Botones de acción (Salir y Tema) */
            .navbar-actions .logout-btn, 
            .navbar-actions .theme-toggle-btn {
              flex: 0 0 auto !important;
              min-width: 52px !important;
              width: auto !important;
              height: 52px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 4px 6px !important;
              gap: 3px !important;
              border-radius: 10px !important;
              background: transparent !important;
              border: 1px solid transparent !important;
              box-sizing: border-box;
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
            }

            .nav-item-btn.active {
              background: rgba(6, 182, 212, 0.12) !important;
              border: 1px solid rgba(6, 182, 212, 0.25) !important;
              color: var(--color-accent) !important;
            }
            
            .nav-label {
              font-size: 0.68rem !important;
              font-weight: 600;
              white-space: nowrap;
              letter-spacing: -0.01em;
              line-height: 1;
              margin-top: 1px;
            }

            .nav-label-desktop {
              display: none !important;
            }

            .nav-label-mobile {
              display: inline-block !important;
            }
          }
        `}
      </style>
    </>
  );
}
