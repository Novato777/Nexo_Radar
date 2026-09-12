import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px', dialogStyle = {}, bodyStyle = {} }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="premium-card modal-dialog-responsive" 
        style={{ 
          width: '100%', 
          maxWidth, 
          position: 'relative', 
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          animation: 'modal-fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          ...dialogStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Fijo con Título y Botón Cerrar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '14px', 
          paddingBottom: '12px', 
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          flexShrink: 0 
        }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: '700' }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              color: 'var(--color-text-secondary)', 
              cursor: 'pointer', 
              width: '34px',
              height: '34px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll Contenido Único */}
        <div 
          className="custom-scrollbar modal-body-scroll"
          style={{ 
            flex: 1, 
            minHeight: 0, 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            ...bodyStyle 
          }}
        >
          {children}
        </div>
      </div>
      <style>
        {`
          @keyframes modal-fade-in {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @media (max-width: 768px) {
            .modal-dialog-responsive {
              width: 95% !important;
              max-width: 95% !important;
              max-height: 94vh !important;
              padding: 16px 12px !important;
              border-radius: 16px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
