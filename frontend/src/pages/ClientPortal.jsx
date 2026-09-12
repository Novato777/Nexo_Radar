import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, Zap, Loader2, CheckCircle2, MapPin, Phone, User, 
  ShieldCheck, AlertCircle, MessageCircle, Wrench, MessageSquare, 
  Check, Sparkles, Send, ArrowRight, QrCode, RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import { API_BASE, getLogoUrl } from '../config';

export default function ClientPortal() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serviceType, setServiceType] = useState('Asistencia General');
  const [message, setMessage] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const checkToken = () => {
    setLoading(true);
    setError('');
    setIsUnassigned(false);

    // Asegurar fondo limpio y neutro para el portal de clientes
    document.documentElement.removeAttribute('data-theme');
    
    axios.get(`${API_BASE}/api/businesses/qr/${token}`)
      .then(res => {
        setBusiness(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log('QR status info:', err.response?.data);
        if (err.response?.status === 404 || err.response?.data?.available) {
          setIsUnassigned(true);
        } else {
          setError('No fue posible contactar el servidor central o el código es inválido.');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    checkToken();
  }, [token]);

  const handleSendSignal = async (e) => {
    if (e) e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API_BASE}/api/requests`, {
        business_id: business.id,
        type: serviceType,
        message: message.trim() || 'Solicitud de atención prioritaria enviada desde terminal QR'
      });
      setSent(true);
    } catch (err) {
      console.error(err);
      setErrorModalOpen(true);
    } finally {
      setSending(false);
    }
  };

  const cleanPhone = business?.phone ? business.phone.replace(/[^0-9]/g, '') : '';
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${encodeURIComponent(`Hola *${business?.business_name || 'Establecimiento'}* 👋 Me comunico a través del portal de atención NeXo Radar.`)}` : null;

  const serviceOptions = [
    { 
      id: 'Asistencia General', 
      label: 'Asistencia General', 
      desc: 'Atención presencial en mesa o salón', 
      icon: Sparkles,
      color: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.15)'
    },
    { 
      id: 'Soporte Técnico', 
      label: 'Soporte Técnico', 
      desc: 'Fallas de equipos, red o sistemas', 
      icon: Wrench,
      color: '#2dd4bf',
      iconBg: 'rgba(45, 212, 191, 0.15)'
    },
    { 
      id: 'Urgencia / Inmediato', 
      label: 'Urgencia', 
      desc: 'Atención prioritaria inmediata', 
      icon: Zap,
      color: '#fb923c',
      iconBg: 'rgba(251, 146, 60, 0.15)'
    },
    { 
      id: 'Consulta de Servicio', 
      label: 'Consulta', 
      desc: 'Dudas sobre cuenta, menú o servicios', 
      icon: MessageSquare,
      color: '#c084fc',
      iconBg: 'rgba(192, 132, 252, 0.15)'
    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at 50% 0%, #151e32 0%, #0b0f19 80%)', padding: '24px' }}>
        <img 
          src="/logo-nexo-radar-dark.png" 
          alt="NeXo Radar" 
          style={{ height: '62px', width: 'auto', marginBottom: '24px', filter: 'drop-shadow(0 4px 16px rgba(6, 182, 212, 0.35))' }} 
        />
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(30, 41, 59, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Loader2 className="animate-spin" size={24} color="#06b6d4" />
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', fontWeight: '500', margin: 0 }}>
          Cargando terminal NeXo Radar...
        </p>
      </div>
    );
  }

  // Pantalla para Códigos QR Físicos que han sido impresos pero aún no vinculados a un comercio
  if (isUnassigned) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 0%, #151e32 0%, #0b0f19 80%)' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.88) 0%, rgba(15, 23, 42, 0.98) 100%)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '36px 28px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)' }}>
          
          {/* Logo NeXo Radar grande de entrada */}
          <img 
            src="/logo-nexo-radar-dark.png" 
            alt="NeXo Radar" 
            style={{ height: '62px', width: 'auto', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 6px 18px rgba(6, 182, 212, 0.35))' }} 
          />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '20px', padding: '4px 14px', color: '#34d399', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            <ShieldCheck size={15} />
            <span>Código QR Válido y Auténtico</span>
          </div>

          <h2 style={{ color: '#f8fafc', fontSize: '1.55rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Terminal NeXo #{token}
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
            Esta tarjeta física pertenece a la red de protección y monitoreo <strong style={{ color: '#38bdf8' }}>NeXo Radar</strong>. El código está generado correctamente y listo para ser asignado a su establecimiento comercial.
          </p>

          <div style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '16px', padding: '16px', textAlign: 'left', marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#f8fafc', fontWeight: '700', fontSize: '0.86rem' }}>
              <CheckCircle2 size={16} color="#06b6d4" />
              <span>¿Qué hacer a continuación?</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45 }}>
              Si eres el administrador o titular de este local y recibiste este material, puedes vincularlo inmediatamente haciendo clic en el botón de abajo.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate(`/register?qr=${encodeURIComponent(token)}`)}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: '750',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Vincular Comercio a este QR</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={checkToken}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontWeight: '600',
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={15} />
              <span>Comprobar Estado de Activación</span>
            </button>

            <a
              href={`https://wa.me/573222067870?text=${encodeURIComponent(`Hola NeXo Radar, tengo en mis manos la tarjeta física con Token #${token} y requiero asistencia para su activación.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                color: '#22c55e',
                fontWeight: '700',
                fontSize: '0.86rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px'
              }}
            >
              <MessageCircle size={16} />
              <span>Soporte Comercial WhatsApp</span>
            </a>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem' }}>
            <ShieldCheck size={14} color="#06b6d4" />
            <span>NeXo Radar &middot; Red Segura de Enlace Comercial</span>
          </div>

        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 0%, #151e32 0%, #0b0f19 80%)' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.88) 0%, rgba(15, 23, 42, 0.98) 100%)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '36px 24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)' }}>
          <img 
            src="/logo-nexo-radar-dark.png" 
            alt="NeXo Radar" 
            style={{ height: '54px', width: 'auto', margin: '0 auto 18px', display: 'block', filter: 'drop-shadow(0 4px 16px rgba(6, 182, 212, 0.35))' }} 
          />
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={26} color="#ef4444" />
          </div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Terminal No Disponible</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>{error}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem' }}>
            <ShieldCheck size={14} color="#06b6d4" />
            <span>NeXo Radar Security Protocol</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexo-qr-portal">
      <style>{`
        .nexo-qr-portal {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 0%, #151e32 0%, #0b0f19 80%);
          color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 28px 16px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }
        .nexo-qr-container {
          width: 100%;
          max-width: 660px;
        }
        .nexo-qr-hero-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 26px;
          text-align: center;
          width: 100%;
        }
        .nexo-qr-hero-logo {
          height: 82px;
          width: auto;
          max-width: 90%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 8px 28px rgba(6, 182, 212, 0.45));
        }
        .nexo-qr-card-profile {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.96) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
        }
        .nexo-qr-card-assistance {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.98) 100%);
          border: 1px solid rgba(6, 182, 212, 0.28);
          border-radius: 18px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(6, 182, 212, 0.06);
        }
        .nexo-qr-card-contact {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.96) 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 18px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
        }
        .nexo-qr-profile-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .nexo-qr-avatar {
          width: 76px;
          height: 76px;
          border-radius: 14px;
          flex-shrink: 0;
          object-fit: cover;
          background: #ffffff;
          border: 2px solid rgba(6, 182, 212, 0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: block;
        }
        .nexo-qr-avatar-fallback {
          width: 76px;
          height: 76px;
          border-radius: 14px;
          flex-shrink: 0;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nexo-qr-contact-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }
        .nexo-qr-options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .nexo-qr-btn-wa {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border-radius: 12px;
          background: #16a34a;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.88rem;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
          transition: all 0.15s ease;
          min-height: 44px;
        }
        .nexo-qr-btn-wa:hover {
          background: #15803d;
          transform: translateY(-1px);
        }
        .nexo-qr-btn-call {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f8fafc;
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          transition: all 0.15s ease;
          min-height: 44px;
        }
        .nexo-qr-btn-call:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }
        @media (max-width: 540px) {
          .nexo-qr-portal {
            padding: 20px 12px 40px;
          }
          .nexo-qr-hero-logo {
            height: 62px;
          }
          .nexo-qr-options-grid {
            grid-template-columns: 1fr;
          }
          .nexo-qr-contact-grid {
            grid-template-columns: 1fr;
          }
          .nexo-qr-avatar, .nexo-qr-avatar-fallback {
            width: 64px;
            height: 64px;
            border-radius: 12px;
          }
          .nexo-qr-profile-header {
            gap: 12px;
          }
        }
      `}</style>

      {/* Contenedor Principal Centrado - Ancho Máximo Profesional */}
      <main className="nexo-qr-container">

        {/* 0. HEADER DE ENTRADA: LOGO NEXO RADAR GRANDE (DE PRIMERAS) */}
        <header className="nexo-qr-hero-header">
          <img 
            src="/logo-nexo-radar-dark.png" 
            alt="NeXo Radar" 
            className="nexo-qr-hero-logo"
          />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '5px 16px',
            borderRadius: '20px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 2px 12px rgba(6, 182, 212, 0.15)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Terminal de Atención Inmediata
            </span>
          </div>
        </header>

        {/* 1. TARJETA DEL ESTABLECIMIENTO (PERFIL DE COMERCIO) */}
        <section className="nexo-qr-card-profile" style={{ padding: '22px', marginBottom: '16px' }}>
          <div className="nexo-qr-profile-header">
            {/* Avatar / Logotipo */}
            <div style={{ flexShrink: 0 }}>
              {business.logo_url ? (
                <img 
                  src={getLogoUrl(business.logo_url)} 
                  alt={business.business_name} 
                  className="nexo-qr-avatar"
                />
              ) : (
                <div className="nexo-qr-avatar-fallback">
                  <Building2 size={32} color="#06b6d4" />
                </div>
              )}
            </div>

            {/* Información Principal del Negocio */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                {/* Status Badge Elegante */}
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '3px 10px', 
                  borderRadius: '16px', 
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#34d399'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10b981' }}></span>
                  <span>Terminal Verificada</span>
                </div>

                {/* Identificador de Nodo */}
                <span style={{ 
                  fontSize: '0.74rem', 
                  color: '#94a3b8', 
                  background: 'rgba(255, 255, 255, 0.06)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '3px 9px', 
                  borderRadius: '6px', 
                  fontFamily: 'monospace', 
                  fontWeight: '700' 
                }}>
                  Nodo #{business.qr_token}
                </span>
              </div>

              {/* Nombre del Establecimiento */}
              <h1 style={{ 
                margin: '0 0 6px 0', 
                fontSize: '1.5rem', 
                fontWeight: '800', 
                color: '#f8fafc', 
                letterSpacing: '-0.02em', 
                lineHeight: '1.25' 
              }}>
                {business.business_name}
              </h1>

              {/* Ubicación y Titular */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#06b6d4" />
                  <span>{business.city || 'Ubicación no especificada'}</span>
                </div>
                {business.owner_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="#94a3b8" />
                    <span>{business.owner_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ficha de Dirección Física (Contextual) */}
          {business.address && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 14px', 
              borderRadius: '10px', 
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.84rem',
              color: '#cbd5e1',
              marginTop: '16px'
            }}>
              <MapPin size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-word' }}>{business.address}</span>
            </div>
          )}
        </section>

        {/* 2. CENTRO DE ASISTENCIA (PRIORIDAD PRINCIPAL DE LA PÁGINA) */}
        <section className="nexo-qr-card-assistance" style={{ padding: '26px 24px', marginBottom: '18px' }}>
          {sent ? (
            /* ESTADO DE ÉXITO SERENO Y PROFESIONAL */
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.15)', 
                border: '1px solid rgba(16, 185, 129, 0.35)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
              }}>
                <CheckCircle2 size={30} color="#10B981" />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 8px 0' }}>
                ¡Solicitud Enviada con Éxito!
              </h2>

              <p style={{ fontSize: '0.94rem', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                Tu requerimiento fue recibido en tiempo real por el personal de <strong style={{ color: '#38bdf8' }}>{business.business_name}</strong>. En breve se acercarán para asistirte.
              </p>

              {/* Resumen del requerimiento enviado */}
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.75)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '14px', 
                padding: '16px 18px', 
                textAlign: 'left',
                marginBottom: '22px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Motivo</span>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '3px 10px', borderRadius: '6px' }}>{serviceType}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', wordBreak: 'break-word' }}>
                  "{message.trim() || 'Solicitud de atención prioritaria enviada desde terminal QR'}"
                </p>
              </div>

              {/* Botón para enviar otra solicitud */}
              <button
                onClick={() => { setSent(false); setMessage(''); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
              >
                <span>Enviar otro requerimiento</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* FORMULARIO DE SOLICITUD SAAS PROFESIONAL */
            <form onSubmit={handleSendSignal}>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ 
                  display: 'inline-block',
                  fontSize: '0.74rem', 
                  color: '#06b6d4', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.06em',
                  marginBottom: '4px' 
                }}>
                  Centro de Asistencia
                </span>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.35rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  ¿Cómo podemos ayudarte?
                </h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
                  Selecciona el motivo y transmite una notificación directa al equipo de atención.
                </p>
              </div>

              {/* Selector de Motivos (Tarjetas de Opción Seleccionables con colores sutiles) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '8px' }}>
                  Selecciona el motivo:
                </label>
                <div className="nexo-qr-options-grid">
                  {serviceOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = serviceType === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setServiceType(opt.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setServiceType(opt.id); } }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '13px 15px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSelected ? 'rgba(6, 182, 212, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          outline: 'none',
                          boxShadow: isSelected ? '0 0 18px rgba(6, 182, 212, 0.28)' : '0 2px 6px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                      >
                        {/* Icono de Categoría con Tinte Suave */}
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '10px', 
                          background: isSelected ? 'rgba(6, 182, 212, 0.25)' : opt.iconBg, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px'
                        }}>
                          <Icon size={19} color={isSelected ? '#38bdf8' : opt.color} />
                        </div>

                        {/* Texto del Motivo */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: isSelected ? '750' : '600', 
                              color: isSelected ? '#38bdf8' : '#f8fafc' 
                            }}>
                              {opt.label}
                            </span>
                            {/* Radio / Check Indicator */}
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%', 
                              border: isSelected ? '5px solid #06b6d4' : '1.5px solid rgba(255, 255, 255, 0.2)',
                              background: isSelected ? '#ffffff' : 'transparent',
                              flexShrink: 0
                            }} />
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.35' }}>
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mensaje Detallado Opcional */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '6px' }}>
                  Mensaje o detalle adicional (opcional):
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej: Mesa #4, requerimos la cuenta o asistencia..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '13px 15px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.45',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { 
                    e.currentTarget.style.borderColor = '#06b6d4'; 
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.2)'; 
                  }}
                  onBlur={(e) => { 
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; 
                    e.currentTarget.style.boxShadow = 'none'; 
                  }}
                />
              </div>

              {/* Botón Principal CTA - MÁXIMA PRIORIDAD */}
              <button
                type="submit"
                disabled={sending}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: '750',
                  cursor: sending ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 22px rgba(6, 182, 212, 0.45)',
                  transition: 'all 0.15s ease',
                  opacity: sending ? 0.75 : 1
                }}
                onMouseOver={(e) => { if (!sending) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                onMouseOut={(e) => { if (!sending) e.currentTarget.style.filter = 'none'; }}
              >
                {sending ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Transmitiendo solicitud...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Solicitud de Atención</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* 3. CANALES DE CONTACTO DIRECTO (UBICADOS AL FINAL PARA NO COMPETIR CON EL CTA) */}
        {(waLink || business.phone) && (
          <section className="nexo-qr-card-contact" style={{ padding: '20px 22px', marginBottom: '26px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ 
                display: 'inline-block',
                fontSize: '0.74rem', 
                color: '#10b981', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '2px' 
              }}>
                Contacto Directo
              </span>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8' }}>
                ¿Prefieres comunicarte directamente con el personal del establecimiento?
              </p>
            </div>

            <div className="nexo-qr-contact-grid" style={{ marginTop: '10px' }}>
              {waLink && (
                <a 
                  href={waLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="nexo-qr-btn-wa"
                >
                  <MessageCircle size={17} />
                  <span>Contactar por WhatsApp</span>
                </a>
              )}

              {business.phone && (
                <a 
                  href={`tel:${business.phone}`}
                  className="nexo-qr-btn-call"
                >
                  <Phone size={15} color="#06b6d4" />
                  <span>Llamar al Local</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* 4. PIE DE PÁGINA SUTIL */}
        <footer style={{ textAlign: 'center', color: '#64748b', paddingBottom: '16px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={16} color="#06b6d4" />
            <span style={{ fontSize: '0.92rem', fontWeight: '750', color: '#94a3b8', letterSpacing: '-0.01em' }}>
              Ne<span style={{ color: '#06b6d4' }}>X</span>o Radar
            </span>
          </div>
          <p style={{ margin: '0 0 2px 0', fontSize: '0.78rem', color: '#64748b' }}>
            Red de Monitoreo y Asistencia Inteligente
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
            Desarrollado por NeXo Software Solutions
          </p>
        </footer>

      </main>

      {/* Modal de Error si falla la conexión */}
      <Modal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} title="Error de Conexión">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <AlertCircle size={24} color="#EF4444" />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#172033', fontWeight: '700' }}>No se pudo enviar la solicitud</h3>
          <p style={{ color: '#667085', marginBottom: '20px', fontSize: '0.88rem', lineHeight: '1.45' }}>
            Hubo un problema de comunicación con el servidor. Por favor verifica tu conexión a internet e intenta nuevamente.
          </p>
          <button 
            className="btn-secondary" 
            onClick={() => setErrorModalOpen(false)} 
            style={{ 
              width: '100%', 
              height: '42px', 
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #D0D5DD',
              color: '#344054',
              fontWeight: '600'
            }}
          >
            Entendido
          </button>
        </div>
      </Modal>

    </div>
  );
}


