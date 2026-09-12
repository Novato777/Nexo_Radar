import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map, BellRing, LogOut, ShieldCheck, 
  Server, Sun, Moon, Database 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNewAlerts, newAlertsCount, clearNewAlertsDot } = useSocket() || {};

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexo_theme') || 'dark';
  });

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

    const isTouchOrAndroid = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator?.userAgent || '') ||
      window.innerWidth <= 860
    );

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
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img 
            src={theme === 'dark' ? '/logo-nexo-radar-dark.png' : '/logo-nexo-radar.png'} 
            alt="NeXo Radar" 
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        {/* Navigation Links (Módulos Principales) */}
        <div className="navbar-links">
          <NavItem path="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem path="/terminales" icon={Server} label="Terminales" />
          <NavItem path="/mapa" icon={Map} label="Mapa" />
          <NavItem path="/alertas" icon={BellRing} label="Alertas" />
          <NavItem path="/base-de-datos" icon={Database} label="Base de Datos" mobileLabel="DB" />
        </div>

        {/* Barra sutil separadora entre los módulos y los botones de funcionalidad */}
        <div className="navbar-divider"></div>

        {/* User Actions: Modo Oscuro/Claro al lado del botón de Salir */}
        <div className="navbar-actions">
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

          /* Mobile / Bottom Tab Bar con espaciado equitativo y alineación perfecta */
          @media (max-width: 768px) {
            .navbar-container {
              position: fixed;
              bottom: 0;
              top: auto;
              left: 0;
              right: 0;
              height: 65px;
              padding: 0 6px;
              border-bottom: none;
              border-top: 1px solid rgba(255,255,255,0.08);
              box-shadow: 0 -4px 14px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-sizing: border-box;
            }
            
            .navbar-brand {
              display: none !important;
            }
            
            /* 5 partes iguales para los 5 módulos */
            .navbar-links {
              display: flex;
              align-items: center;
              flex: 5;
              gap: 0;
              height: 100%;
              margin: 0;
              padding: 0;
            }

            /* Barra sutil divisoria entre módulos y botones de funcionalidad */
            .navbar-divider {
              display: block;
              width: 1px;
              height: 28px;
              background: rgba(255, 255, 255, 0.16);
              margin: 0 5px;
              flex-shrink: 0;
              border-radius: 1px;
              align-self: center;
            }

            [data-theme="light"] .navbar-divider {
              background: rgba(0, 0, 0, 0.14);
            }
            
            /* 2 partes iguales para los 2 botones de acción */
            .navbar-actions {
              display: flex;
              align-items: center;
              flex: 2;
              gap: 0;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            
            /* Todos los botones con exactamente el mismo ancho, altura y alineación */
            .nav-item-btn, .logout-btn, .theme-toggle-btn {
              flex: 1 1 0px !important;
              width: 0 !important;
              min-width: 0 !important;
              height: 52px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 4px 2px !important;
              gap: 3px !important;
              border-radius: 10px !important;
              background: transparent !important;
              border: 1px solid transparent !important;
              box-sizing: border-box;
            }

            .nav-item-btn.active {
              background: rgba(6, 182, 212, 0.12) !important;
              border: 1px solid rgba(6, 182, 212, 0.25) !important;
              color: var(--color-accent) !important;
            }
            
            .nav-label {
              font-size: 0.65rem !important;
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
