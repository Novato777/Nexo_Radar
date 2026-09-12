import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import useKeepAlive from '../hooks/useKeepAlive';

export default function Layout({ children }) {
  // Motor de Keep-Alive inteligente y detección de inactividad
  useKeepAlive();

  const location = useLocation();
  const isMap = location.pathname === '/mapa';

  useEffect(() => {
    const savedTheme = localStorage.getItem('nexo_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  return (
    <div className={`layout-container ${isMap ? 'layout-map-mode' : ''}`}>
      <Navbar />
      <main className={`layout-main ${isMap ? 'layout-main-map' : ''}`}>
        {children}
      </main>
      <style>
        {`
          .layout-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: var(--color-bg);
            transition: background-color 0.3s ease;
          }
          .layout-main {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          /* Modo Mapa: Dimensiones exactas sin scroll de página ni desplazamientos */
          .layout-container.layout-map-mode {
            height: 100vh;
            max-height: 100vh;
            overflow: hidden;
          }
          .layout-main.layout-main-map {
            height: calc(100vh - 70px);
            max-height: calc(100vh - 70px);
            overflow: hidden;
            padding-bottom: 0 !important;
          }

          @media (max-width: 768px) {
            .layout-main {
              /* Añadir padding bottom equivalente al alto del Navbar en móvil para páginas con scroll */
              padding-bottom: 75px; 
            }

            .layout-container.layout-map-mode {
              height: 100dvh !important;
              max-height: 100dvh !important;
              overflow: hidden !important;
            }
            .layout-main.layout-main-map {
              height: calc(100dvh - 65px) !important;
              max-height: calc(100dvh - 65px) !important;
              padding-bottom: 0 !important;
              overflow: hidden !important;
            }
          }
        `}
      </style>
    </div>
  );
}
