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
          animation: 'modal-fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          borderRadius: '20px',
          padding: '24px',
          ...dialogStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Fijo con Título y Botón Cerrar */}
        <div 
          className="modal-header-responsive"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px', 
            paddingBottom: '14px', 
            flexShrink: 0 
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)', fontWeight: '800', letterSpacing: '-0.01em' }}>{title}</h2>
          <button 
            onClick={onClose}
            className="modal-close-btn"
            style={{ 
              cursor: 'pointer', 
              width: '36px',
              height: '36px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
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
