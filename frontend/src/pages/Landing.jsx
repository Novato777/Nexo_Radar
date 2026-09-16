import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radar, QrCode, Shield, Zap, MapPin, BellRing, 
  ArrowRight, CheckCircle2, MessageSquare, Phone, 
  Send, Sparkles, ExternalLink, Activity, Server, 
  Smartphone, ChevronRight, Layers, Lock, Mail, MessageCircle,
  Wifi, Cpu, Radio, Globe, BarChart3, Check, RefreshCw, Terminal,
  Maximize2, Play, Eye
} from 'lucide-react';
import { buildWhatsAppUrl } from '../config';
import Footer from '../components/Footer';
export default function Landing() {
  const navigate = useNavigate();

  // Estados de la simulación interactiva del ecosistema QR
  const [simStep, setSimStep] = useState('idle'); // 'idle' | 'approaching' | 'scanning' | 'authorized' | 'dispatched'
  const [activeSignalType, setActiveSignalType] = useState('Soporte Técnico');
  const [terminalLed, setTerminalLed] = useState('standby'); // 'standby' | 'reading' | 'connected'
  const [pingValue, setPingValue] = useState(24);
  const [activeTabTelemetry, setActiveTabTelemetry] = useState('satelital'); // 'satelital' | 'flujo'

  // Estados del Formulario de Contacto
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    fleetSize: '10-50',
    businessType: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Detección de sesión activa
  const [hasAuth, setHasAuth] = useState(false);

  // Estados y Refs para Mobile UX: Snap Scroll / Swipe y Sticky CTA
  const bentoScrollRef = useRef(null);
  const [activeBentoDot, setActiveBentoDot] = useState(0);
  const timelineScrollRef = useRef(null);
  const [activeTimelineDot, setActiveTimelineDot] = useState(0);
  const [showStickyCta, setShowStickyCta] = useState(false);

  // Ping aleatorio realista para la telemetría viva
  useEffect(() => {
    setHasAuth(!!localStorage.getItem('nexo_auth'));
    const interval = setInterval(() => {
      setPingValue(Math.floor(21 + Math.random() * 8));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Forzar modo oscuro en la landing y detector de scroll para el CTA Sticky
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    const handleScroll = () => {
      // Activa el botón sticky en móvil cuando el usuario hace scroll hacia abajo
      setShowStickyCta(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers para el Scroll Snap (Swipe) en Móvil
  const handleBentoScroll = () => {
    if (!bentoScrollRef.current) return;
    const { scrollLeft, offsetWidth } = bentoScrollRef.current;
    const index = Math.round(scrollLeft / (offsetWidth * 0.82));
    setActiveBentoDot(Math.min(Math.max(index, 0), 3));
  };

  const handleTimelineScroll = () => {
    if (!timelineScrollRef.current) return;
    const { scrollLeft, offsetWidth } = timelineScrollRef.current;
    const index = Math.round(scrollLeft / (offsetWidth * 0.82));
    setActiveTimelineDot(Math.min(Math.max(index, 0), 2));
  };

  const scrollToBentoCard = (index) => {
    if (!bentoScrollRef.current) return;
    const cardWidth = bentoScrollRef.current.offsetWidth * 0.84;
    bentoScrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    setActiveBentoDot(index);
  };

  const scrollToTimelineStep = (index) => {
    if (!timelineScrollRef.current) return;
    const stepWidth = timelineScrollRef.current.offsetWidth * 0.86;
    timelineScrollRef.current.scrollTo({
      left: index * stepWidth,
      behavior: 'smooth'
    });
    setActiveTimelineDot(index);
  };

  // Disparador de simulación con scroll suave desde el Hero
  const handleHeroSimulateClick = () => {
    const ecosystemSection = document.getElementById('ecosistema');
    if (ecosystemSection) {
      ecosystemSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        handleStartScanSimulation('Soporte Técnico');
      }, 550);
    }
  };

  // Orquestador de la animación de escaneo en 4 fases literales y realistas
  const handleStartScanSimulation = (signalType = activeSignalType) => {
    if (simStep !== 'idle') return;
    setActiveSignalType(signalType);
    setSimStep('approaching');
    setTerminalLed('standby');

    // Fase 1: El teléfono enfoca y se aproxima hacia la terminal física
    setTimeout(() => {
      setSimStep('scanning');
      setTerminalLed('reading');

      // Fase 2: El láser cian barre el código QR y la terminal decodifica el token
      setTimeout(() => {
        setSimStep('authorized');
        setTerminalLed('connected');

        // Fase 3: La señal es transmitida satelitalmente al radar del operador
        setTimeout(() => {
          setSimStep('dispatched');

          // Retorno a reposo tras exhibición
          setTimeout(() => {
            setSimStep('idle');
            setTerminalLed('standby');
          }, 4500);
        }, 1400);
      }, 1600);
    }, 850);
  };

  // Validación en tiempo real del formulario
  const validateField = (name, value) => {
    let error = '';
    if (name === 'name' && (!value || value.trim().length < 3)) {
      error = 'Ingresa tu nombre completo (mínimo 3 caracteres)';
    }
    if (name === 'phone' && (!value || value.replace(/\D/g, '').length < 7)) {
      error = 'Ingresa un número telefónico o WhatsApp válido';
    }
    setFormErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmitContact = (e) => {
    e.preventDefault();
    const isNameValid = validateField('name', formData.name);
    const isPhoneValid = validateField('phone', formData.phone);

    if (!isNameValid || !isPhoneValid) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Abrir WhatsApp con mensaje preformateado
      const msg = `Hola NeXo Radar, mi nombre es ${formData.name}. Requiero información sobre la plataforma para mi negocio (${formData.businessType || 'Comercio'}) con una flota estimada de ${formData.fleetSize} terminales. Mi teléfono de contacto es ${formData.phone}.`;
      window.open(buildWhatsAppUrl('573222067870', msg), '_blank');
      
      setTimeout(() => setSubmitSuccess(false), 8000);
    }, 600);
  };

  return (
    <div className="landing-root">
      
      {/* MALLA DE FONDO Y DATA-GLOW AMBIENTAL */}
      <div className="landing-grid-mesh" />
      <div className="ambient-glow glow-top" />
      <div className="ambient-glow glow-center" />

      {/* 1. NAVBAR GLASSMORPHIC PREMIUM (SIN TEXTO REDUNDANTE) */}
      <header className="landing-header">
        <div className="landing-container header-inner">
          
          {/* Brand Logo Oficial (Solo la imagen gráfica limpia sin texto duplicado) */}
          <div 
            className="brand-logo-wrapper" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="NeXo Radar - Inicio"
          >
            <img 
              src="/logo-nexo-radar-dark.png" 
              alt="NeXo Radar" 
              className="brand-clean-logo" 
            />
          </div>

          {/* Grupo de Navegación y Acceso a Consola agrupados a la derecha */}
          <div className="header-right-group">
            <nav className="desktop-nav">
              <a href="#ecosistema" className="nav-item">Ecosistema QR</a>
              <a href="#telemetria" className="nav-item">Mission Control</a>
              <a href="#arquitectura" className="nav-item">Arquitectura</a>
              <a href="#contacto" className="nav-item">Despliegue</a>
            </nav>

            <div className="header-nav-divider" />

            <div className="header-actions">
              <button 
                onClick={() => navigate(hasAuth ? '/dashboard' : '/login')}
                className="btn-console"
                title={hasAuth ? 'Ir a la consola de operaciones activa' : 'Entrar a la consola de administración'}
              >
                <Terminal size={15} className="console-icon" />
                <span>{hasAuth ? 'Consola Activa' : 'Acceso a Consola'}</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. HERO ASIMÉTRICO CON MISSION CONTROL CLARO E INTUITIVO */}
      <section className="hero-section" id="telemetria">
        <div className="landing-container hero-grid">
          
          {/* Lado Izquierdo: Narrativa de Alto Impacto y Botón de Simulación Activo */}
          <div className="hero-content">
            <div className="live-status-pill">
              <span className="live-pulse-dot" />
              <span className="live-pill-text">RED ACTIVA EN TIEMPO REAL · COLOMBIA</span>
              <span className="live-ping-badge">{pingValue}ms</span>
            </div>

            <h1 className="hero-headline">
              Monitoreo Satelital y Telemetría de <span className="headline-gradient">Terminales QR</span> en Vivo.
            </h1>

            <p className="hero-subline">
              La plataforma reactiva que conecta cualquier punto de venta con una central de operaciones. Tu cliente escanea el código con su cámara y el operador recibe la alerta geolocalizada en menos de un segundo.
            </p>

            <div className="hero-cta-group">
              {/* Botón con Propósito Visual Claro: Desencadena animación interactiva */}
              <button 
                onClick={handleHeroSimulateClick}
                className="btn-hero-simulate"
                title="Desplazarse y ver la simulación interactiva 3D del escaneo QR"
              >
                <div className="btn-icon-pulse">
                  <Zap size={18} />
                </div>
                <span>Simular Escaneo en Vivo</span>
                <ArrowRight size={16} className="btn-arrow" />
              </button>

              <button 
                onClick={() => navigate(hasAuth ? '/dashboard' : '/login')}
                className="btn-hero-secondary"
              >
                <Lock size={16} />
                <span>{hasAuth ? 'Ir al Dashboard' : 'Iniciar Sesión'}</span>
              </button>
            </div>

            {/* Badges de Confianza */}
            <div className="hero-trust-bar">
              <div className="trust-item">
                <CheckCircle2 size={16} color="#10b981" />
                <span>Cero descargas de apps para el cliente</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} color="#10b981" />
                <span>Notificación en pantalla bloqueada (Android PWA)</span>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Dashboard Mission Control Intuitivo y Digestible */}
          <div className="hero-telemetry-wrapper">
            <div className="telemetry-card-glass">
              
              {/* Header de la consola */}
              <div className="telemetry-header">
                <div className="telemetry-title-group">
                  <div className="radar-icon-box">
                    <Radar size={18} color="#06b6d4" className="radar-spin" />
                  </div>
                  <div>
                    <h3 className="telemetry-h3">NEXO MISSION CONTROL</h3>
                    <span className="telemetry-stream-tag">PANEL DE OPERACIONES EN VIVO</span>
                  </div>
                </div>

                <div className="telemetry-tabs">
                  <button 
                    onClick={() => setActiveTabTelemetry('satelital')}
                    className={`telemetry-tab-btn ${activeTabTelemetry === 'satelital' ? 'active' : ''}`}
                  >
                    Radar Satelital
                  </button>
                  <button 
                    onClick={() => setActiveTabTelemetry('flujo')}
                    className={`telemetry-tab-btn ${activeTabTelemetry === 'flujo' ? 'active' : ''}`}
                  >
                    Flujo de Alerta
                  </button>
                </div>
              </div>

              {/* Contenido Visual Digestible según Pestaña */}
              {activeTabTelemetry === 'satelital' ? (
                <div className="telemetry-body">
                  
                  {/* Visor de Radar Táctico Intuitivo */}
                  <div className="radar-viewport">
                    <div className="radar-sweep-cone" />
                    <div className="radar-ring ring-1" />
                    <div className="radar-ring ring-2" />
                    <div className="radar-crosshair-h" />
                    <div className="radar-crosshair-v" />

                    {/* Nodo Detectado en Vivo */}
                    <div className="radar-blip-node blip-1">
                      <div className="blip-ring" />
                      <div className="blip-dot" />
                      <div className="blip-card">
                        <strong>NODO #001</strong>
                        <span>Barbería El Maestro · Activo</span>
                      </div>
                    </div>

                    <div className="radar-blip-node blip-2">
                      <div className="blip-dot small" />
                    </div>
                  </div>

                  {/* Grid 2x2 de Métricas Digestibles (Pensadas para Todo Usuario) */}
                  <div className="telemetry-metrics-bento">
                    
                    <div className="metric-box-sub">
                      <div className="metric-top-row">
                        <span className="metric-title">Tiempo de Respuesta</span>
                        <Zap size={14} color="#06b6d4" />
                      </div>
                      <div className="metric-big-val">&lt;800ms</div>
                      <div className="metric-desc-pill green">Velocidad subsegundo</div>
                    </div>

                    <div className="metric-box-sub">
                      <div className="metric-top-row">
                        <span className="metric-title">Disponibilidad SLA</span>
                        <Server size={14} color="#10b981" />
                      </div>
                      <div className="metric-big-val">99.9%</div>
                      <div className="metric-desc-pill">Monitoreo 24/7 en nube</div>
                    </div>

                    <div className="metric-box-sub">
                      <div className="metric-top-row">
                        <span className="metric-title">Instalación Clientes</span>
                        <Smartphone size={14} color="#f59e0b" />
                      </div>
                      <div className="metric-big-val">0 Apps</div>
                      <div className="metric-desc-pill amber">Cámara nativa celular</div>
                    </div>

                    <div className="metric-box-sub">
                      <div className="metric-top-row">
                        <span className="metric-title">Geolocalización GPS</span>
                        <MapPin size={14} color="#38bdf8" />
                      </div>
                      <div className="metric-big-val">100%</div>
                      <div className="metric-desc-pill blue">Ubicación precisa en mapa</div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="telemetry-body">
                  {/* Flujo Operativo Explicativo Paso a Paso */}
                  <div className="flow-explanation-box">
                    <div className="flow-step-visual">
                      <div className="flow-icon-circ">
                        <QrCode size={22} color="#06b6d4" />
                      </div>
                      <div className="flow-step-text">
                        <strong>1. Cliente Escanea QR</strong>
                        <p>Apunta su cámara al soporte acrílico del local.</p>
                      </div>
                    </div>

                    <div className="flow-connector-arrow">
                      <ChevronRight size={18} color="#06b6d4" />
                    </div>

                    <div className="flow-step-visual">
                      <div className="flow-icon-circ">
                        <Radio size={22} color="#f59e0b" />
                      </div>
                      <div className="flow-step-text">
                        <strong>2. Enlace en Nube</strong>
                        <p>WebSocket SSL emite la señal al radar central.</p>
                      </div>
                    </div>

                    <div className="flow-connector-arrow">
                      <ChevronRight size={18} color="#06b6d4" />
                    </div>

                    <div className="flow-step-visual">
                      <div className="flow-icon-circ">
                        <BellRing size={22} color="#10b981" />
                      </div>
                      <div className="flow-step-text">
                        <strong>3. Operador Atiende</strong>
                        <p>Pantalla vibra y abre chat de WhatsApp al instante.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flow-status-banner">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Conexión simultánea a PC y teléfonos Android en segundo plano</span>
                  </div>
                </div>
              )}

              {/* Footer de la Consola */}
              <div className="telemetry-footer">
                <div className="telemetry-status-ok">
                  <Wifi size={14} color="#10b981" />
                  <span>Servidor perimetral en línea (Colombia co-west-1)</span>
                </div>
                <button 
                  onClick={handleHeroSimulateClick}
                  className="btn-trigger-pulse"
                >
                  <Play size={13} />
                  <span>Ver Demostración</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. SECCIÓN DE DEMOSTRACIÓN QR: ANIMACIÓN LITERAL Y REALISTA */}
      <section id="ecosistema" className="ecosystem-section">
        <div className="landing-container">
          
          <div className="section-pre-header">
            <span className="section-tag">
              <Sparkles size={14} /> DEMOSTRACIÓN INTERACTIVA EN VIVO
            </span>
            <h2 className="section-title">
              ¿Cómo Funciona el <span className="headline-gradient">Ecosistema QR</span> de NeXo Radar?
            </h2>
            <p className="section-desc">
              Observa en tiempo real cómo un smartphone escanea la terminal física y sincroniza la alerta satelital con la central operativa sin fricciones.
            </p>
          </div>

          {/* Layout Asimétrico: Simulador Visual Realista (Izq) + Secuencia de Pasos con Grid Simétrico (Der) */}
          <div className="ecosystem-grid">
            
            {/* LADO 1: ANIMACIÓN LITERAL DEL SMARTPHONE ESCANEANDO LA TERMINAL */}
            <div className="simulator-canvas">
              
              {/* Barra de Selección de Emergencia */}
              <div className="signal-selector-bar">
                <span className="selector-title">Elige tipo de alerta:</span>
                <div className="selector-buttons">
                  {['Soporte Técnico', 'Atención Comercial', 'Asistencia Inmediata'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleStartScanSimulation(type)}
                      disabled={simStep !== 'idle'}
                      className={`btn-signal-chip ${activeSignalType === type ? 'active' : ''}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escenario de Simulación 3D Literal */}
              <div className="simulation-stage">
                
                {/* DISPOSITIVO A: TERMINAL QR FÍSICA (Base acrílica con QR de alta definición) */}
                <div className={`physical-terminal ${terminalLed === 'connected' ? 'terminal-connected' : ''}`}>
                  
                  {/* Aro LED inteligente en el marco */}
                  <div className={`terminal-led-ring led-${terminalLed}`}>
                    <span className="led-flare" />
                  </div>

                  <div className="terminal-case-header">
                    <div className="terminal-brand">
                      <div className="brand-dot-matrix" />
                      <span>TERMINAL FÍSICA #001</span>
                    </div>
                    <div className="terminal-signal-bars">
                      <span className="bar active" />
                      <span className="bar active" />
                      <span className="bar active" />
                      <span className="bar" />
                    </div>
                  </div>

                  {/* Pantalla OLED Embebida en la Terminal */}
                  <div className="terminal-oled-screen">
                    {terminalLed === 'standby' && (
                      <div className="oled-content standby">
                        <span className="oled-cursor">&gt;</span>
                        <span>LISTO PARA ENLACE</span>
                      </div>
                    )}
                    {terminalLed === 'reading' && (
                      <div className="oled-content reading">
                        <span className="oled-spin" />
                        <span>ESCANEANDO QR...</span>
                      </div>
                    )}
                    {terminalLed === 'connected' && (
                      <div className="oled-content connected">
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>SEÑAL ENVIADA AL RADAR</span>
                      </div>
                    )}
                  </div>

                  {/* Placa QR de la Terminal con Haz Láser Dinámico */}
                  <div className="terminal-qr-plate">
                    <div className="qr-box-inner">
                      <QrCode size={110} color="#f8fafc" />
                      
                      {/* Haz de Luz Láser que se proyecta sobre el QR */}
                      {simStep === 'scanning' && (
                        <div className="laser-sweep-line" />
                      )}
                    </div>
                    <span className="qr-serial-code">NODO: BOG-NX-7026</span>
                  </div>

                  <div className="terminal-base-foot">
                    <span>TRANSMISIÓN SATELITAL ACTIVA</span>
                  </div>
                </div>

                {/* HAZ PROYECTADO ENTRE CELULAR Y QR */}
                {simStep === 'scanning' && (
                  <div className="laser-cone-projection" />
                )}

                {/* DISPOSITIVO B: SMARTPHONE REALISTA (Render con pantalla OLED y cámara activa) */}
                <div className={`smartphone-mockup pos-${simStep}`}>
                  <div className="phone-outer-frame">
                    <div className="phone-notch">
                      <span className="camera-lens" />
                      <span className="speaker-ear" />
                    </div>
                    
                    <div className="phone-screen-oled">
                      
                      {/* Estado 1: Enfoque de Cámara con Guías */}
                      {simStep === 'idle' && (
                        <div className="phone-state idle">
                          <div className="cam-viewfinder">
                            <div className="corner top-left" />
                            <div className="corner top-right" />
                            <div className="corner btm-left" />
                            <div className="corner btm-right" />
                            <span className="cam-hint">Apunta al código QR</span>
                          </div>
                          <button 
                            onClick={() => handleStartScanSimulation()}
                            className="btn-trigger-scan"
                          >
                            ▶ Escanear Ahora
                          </button>
                        </div>
                      )}

                      {/* Estado 2: Acercándose */}
                      {simStep === 'approaching' && (
                        <div className="phone-state approaching">
                          <div className="cam-viewfinder focused">
                            <span className="cam-detecting">Enfocando placa NeXo...</span>
                          </div>
                        </div>
                      )}

                      {/* Estado 3: Escaneando con Láser */}
                      {simStep === 'scanning' && (
                        <div className="phone-state scanning">
                          <div className="cam-viewfinder scanning">
                            <div className="phone-laser-line" />
                            <span className="cam-reading">Decodificando Token...</span>
                          </div>
                        </div>
                      )}

                      {/* Estado 4: Éxito Instantáneo (Confirmación en Smartphone) */}
                      {(simStep === 'authorized' || simStep === 'dispatched') && (
                        <div className="phone-state success">
                          <div className="success-icon-badge">
                            <CheckCircle2 size={32} color="#10b981" />
                          </div>
                          <h4 className="success-h4">¡Alerta Recibida!</h4>
                          <span className="success-tag">Enlace Satelital Activo</span>
                          <p className="success-node">Nodo #001 · Barbería El Maestro</p>
                          
                          <div className="dispatch-preview-chip">
                            <span className="chip-type">{activeSignalType}</span>
                            <span className="chip-sent">Transmitido al Operador</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

              </div>

              {/* Botón de Control de la Simulación */}
              <div className="stage-controls">
                <button
                  onClick={() => handleStartScanSimulation()}
                  disabled={simStep !== 'idle'}
                  className="btn-run-simulation"
                >
                  <RefreshCw size={16} className={simStep !== 'idle' ? 'animate-spin' : ''} />
                  <span>{simStep === 'idle' ? 'Ejecutar Simulación de Escaneo' : 'Escaneando en Vivo...'}</span>
                </button>
              </div>

            </div>

            {/* LADO 2: SECUENCIA DE PASOS (GRID SIMÉTRICO Y ALINEACIÓN PERFECTA) */}
            <div className="operational-timeline">
              <div className="timeline-header">
                <h3 className="timeline-title">Secuencia de Enlace Ininterrumpido</h3>
                <p className="timeline-subtitle">
                  El ciclo completo opera en milisegundos con sincronización criptográfica punto a punto.
                </p>
              </div>

              {/* Contenedor de Pasos con Grid Sólido y Soporte Swipe Snap en Móvil */}
              <div 
                className="timeline-steps-container"
                ref={timelineScrollRef}
                onScroll={handleTimelineScroll}
              >
                
                {/* Paso 1 */}
                <div className={`timeline-step-row ${simStep === 'approaching' || simStep === 'scanning' ? 'active' : ''} ${simStep === 'authorized' || simStep === 'dispatched' ? 'completed' : ''}`}>
                  <div className="step-marker-col">
                    <div className="step-marker-circle">
                      {simStep === 'authorized' || simStep === 'dispatched' ? <Check size={16} color="#10b981" /> : '1'}
                    </div>
                    <div className="step-connector-track" />
                  </div>
                  <div className="step-content-card">
                    <div className="step-card-header">
                      <h4 className="step-name">Detección Óptica Directa</h4>
                      <span className="step-pill">Cámara Nativa</span>
                    </div>
                    <p className="step-description">
                      El cliente apunta con la cámara de su teléfono sin descargar aplicaciones ni registrarse. La URL única desencadena la sesión segura de inmediato.
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className={`timeline-step-row ${simStep === 'authorized' ? 'active' : ''} ${simStep === 'dispatched' ? 'completed' : ''}`}>
                  <div className="step-marker-col">
                    <div className="step-marker-circle">
                      {simStep === 'dispatched' ? <Check size={16} color="#10b981" /> : '2'}
                    </div>
                    <div className="step-connector-track" />
                  </div>
                  <div className="step-content-card">
                    <div className="step-card-header">
                      <h4 className="step-name">Transmisión WebSocket &amp; VAPID Push</h4>
                      <span className="step-pill green">&lt;800ms Latencia</span>
                    </div>
                    <p className="step-description">
                      El backend emite el evento en tiempo real a las consolas activas y despierta los teléfonos Android del equipo operativo aunque estén con la pantalla apagada.
                    </p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className={`timeline-step-row ${simStep === 'dispatched' ? 'active' : ''}`}>
                  <div className="step-marker-col">
                    <div className="step-marker-circle">3</div>
                  </div>
                  <div className="step-content-card">
                    <div className="step-card-header">
                      <h4 className="step-name">Centrado en Radar Satelital &amp; WhatsApp</h4>
                      <span className="step-pill blue">Despacho Inmediato</span>
                    </div>
                    <p className="step-description">
                      El mapa satelital salta al punto exacto del negocio con aura pulsante, permitiendo al operador tomar el caso y entablar contacto directo con un solo toque.
                    </p>
                  </div>
                </div>

              </div>

              {/* Indicadores Táctiles de Swipe en Móvil (Paso 1, 2, 3) */}
              <div className="mobile-carousel-indicators mobile-only">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`carousel-dot ${activeTimelineDot === idx ? 'active' : ''}`}
                    onClick={() => scrollToTimelineStep(idx)}
                    aria-label={`Ir al paso ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Callout de Trazabilidad Multiusuario */}
              <div className="timeline-collaborator-callout">
                <div className="callout-icon-box">
                  <Shield size={20} color="#06b6d4" />
                </div>
                <div className="callout-text-box">
                  <h5 className="callout-title">Trazabilidad en Vivo por Colaborador</h5>
                  <p className="callout-desc">
                    Cuando un supervisor pulsa <em>"Tomar Caso"</em>, toda la red visualiza inmediatamente: <strong>"En revisión por Cristian"</strong>, garantizando cero llamadas duplicadas.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. CARACTERÍSTICAS: BENTO GRID OPTIMIZADO (GRID DE 2 COLUMNAS EN MÓVIL) */}
      <section id="arquitectura" className="bento-section">
        <div className="landing-container">
          
          <div className="section-pre-header">
            <span className="section-tag">
              <Layers size={14} /> CAPACIDADES DE ALTO RENDIMIENTO
            </span>
            <h2 className="section-title">
              Diseñado como una <span className="headline-gradient">Suite de Mando</span>.
            </h2>
            <p className="section-desc">
              Cada componente ha sido construido bajo principios modulares para soportar flotas masivas de terminales con latencia mínima.
            </p>
          </div>

          {/* Grid Asimétrico en Escritorio y Snap Carousel (Swipe) en Móvil */}
          <div 
            className="bento-responsive-grid"
            ref={bentoScrollRef}
            onScroll={handleBentoScroll}
          >
            
            {/* Card 1: Radar Satelital */}
            <div className="bento-card bento-card-wide">
              <div className="bento-card-glow" />
              <div className="bento-icon-box cyan">
                <Radar size={24} />
              </div>
              
              <div className="bento-content">
                <div className="bento-tag">TELEMETRÍA SATELITAL</div>
                <h3 className="bento-h3">Mapeo Georreferenciado Activo</h3>
                <p className="bento-p">
                  Despliegue con Leaflet que ubica cada negocio con pines dinámicos. Indica si el punto está en estado <strong>Seguro</strong>, <strong>En Revisión</strong> o con <strong>Alerta Crítica</strong> en tiempo real.
                </p>
                <div className="bento-data-chip">
                  <MapPin size={13} color="#06b6d4" />
                  <span>Precisión satelital &lt;10m · Auto centrado</span>
                </div>
              </div>
            </div>

            {/* Card 2: Web Push & Pantalla Bloqueada */}
            <div className="bento-card">
              <div className="bento-icon-box amber">
                <Smartphone size={24} />
              </div>
              <div className="bento-content">
                <div className="bento-tag">PWA RESILIENTE</div>
                <h3 className="bento-h3">Alertas en Pantalla Apagada</h3>
                <p className="bento-p">
                  Service Worker en segundo plano con VAPID Push Manager. Despierta tu teléfono Android aunque esté bloqueado en el bolsillo.
                </p>
                <div className="bento-data-chip">
                  <Radio size={13} color="#f59e0b" />
                  <span>Vibración táctica + Push directo</span>
                </div>
              </div>
            </div>

            {/* Card 3: Cloudinary CDN Multimedia */}
            <div className="bento-card">
              <div className="bento-icon-box blue">
                <Server size={24} />
              </div>
              <div className="bento-content">
                <div className="bento-tag">INFRAESTRUCTURA CLOUD</div>
                <h3 className="bento-h3">CDN Multimedia Persistente</h3>
                <p className="bento-p">
                  Almacenamiento de logotipos y evidencias en Cloudinary CDN de alta disponibilidad con streaming en memoria. Cero pérdida de imágenes.
                </p>
                <div className="bento-data-chip">
                  <Cpu size={13} color="#3b82f6" />
                  <span>Carga subsegundo en redes 4G/5G</span>
                </div>
              </div>
            </div>

            {/* Card 4: Seguridad & Roles */}
            <div className="bento-card bento-card-wide-2">
              <div className="bento-icon-box emerald">
                <Shield size={24} />
              </div>
              <div className="bento-content">
                <div className="bento-tag">SEGURIDAD ZERO-TRUST</div>
                <h3 className="bento-h3">Roles Protegidos &amp; Módulo Super Admin</h3>
                <p className="bento-p">
                  Tus colaboradores acceden exclusivamente a Dashboard, Terminales, Mapa y Alertas. Las bases de datos y la administración de credenciales quedan blindadas para administradores.
                </p>
                <div className="bento-data-chip">
                  <Lock size={13} color="#10b981" />
                  <span>Bcrypt Criptográfico + JWT Seguro</span>
                </div>
              </div>
            </div>

          </div>

          {/* Indicadores Táctiles de Swipe en Móvil (4 Tarjetas) */}
          <div className="mobile-carousel-indicators mobile-only">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                className={`carousel-dot ${activeBentoDot === idx ? 'active' : ''}`}
                onClick={() => scrollToBentoCard(idx)}
                aria-label={`Ir a tarjeta ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* 5. SECCIÓN CONTACTO: DESPLIEGUE CONTROLADO */}
      <section id="contacto" className="contact-section">
        <div className="landing-container">
          
          <div className="contact-wrapper-card">
            
            <div className="contact-left-col">
              <span className="section-tag">
                <Phone size={14} /> DESPLIEGUE EMPRESARIAL
              </span>
              <h2 className="contact-headline">
                Comienza a Monitorear tus Terminales con <span className="headline-gradient">NeXo Radar</span>.
              </h2>
              <p className="contact-p">
                Entregamos terminales físicas QR de alta resistencia y habilitamos la consola satelital para todo tu equipo de supervisores.
              </p>

              <div className="quick-contact-pills">
                <a 
                  href={buildWhatsAppUrl('573222067870', 'Hola NeXo Radar, quisiera coordinar una demostración empresarial.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quick-whatsapp-card"
                >
                  <div className="wa-icon-circ">
                    <MessageCircle size={22} color="#10b981" />
                  </div>
                  <div>
                    <span className="wa-label">Línea Directa de Atención</span>
                    <span className="wa-number">+57 322 206 7870</span>
                  </div>
                </a>

                <div className="coverage-badge">
                  <Globe size={18} color="#06b6d4" />
                  <span>Despliegue y Cobertura en toda Colombia</span>
                </div>
              </div>
            </div>

            {/* Formulario Controlado */}
            <div className="contact-form-col">
              <form onSubmit={handleSubmitContact} className="controlled-form">
                
                <h3 className="form-h3">Solicitar Propuesta y Acceso</h3>
                <p className="form-subtitle">Completa los datos para conectar inmediatamente con un asesor:</p>

                {/* Nombre */}
                <div className="form-group">
                  <label className="form-lbl">Nombre o Razón Social *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Andrés Gómez - Comercializadora Andina"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={`form-input-styled ${formErrors.name ? 'error' : ''}`}
                    required
                  />
                  {formErrors.name && <span className="form-err">{formErrors.name}</span>}
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label className="form-lbl">Número Telefónico / WhatsApp *</label>
                  <input 
                    type="tel" 
                    placeholder="Ej. +57 300 123 4567"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className={`form-input-styled ${formErrors.phone ? 'error' : ''}`}
                    required
                  />
                  {formErrors.phone && <span className="form-err">{formErrors.phone}</span>}
                </div>

                {/* Selector de Flota */}
                <div className="form-group">
                  <label className="form-lbl">Cantidad Estimada de Terminales QR</label>
                  <div className="fleet-selector-grid">
                    {['1 - 10', '10 - 50', '50 - 200', '200+'].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleInputChange('fleetSize', size)}
                        className={`fleet-btn ${formData.fleetSize === size ? 'active' : ''}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sector Comercial */}
                <div className="form-group">
                  <label className="form-lbl">Sector o Tipo de Negocio</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Cadena de Restaurantes, Barberías, Red de Talleres..."
                    value={formData.businessType}
                    onChange={e => handleInputChange('businessType', e.target.value)}
                    className="form-input-styled"
                  />
                </div>

                {/* Botón de Envío */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-submit-contact"
                >
                  <Send size={18} />
                  <span>{isSubmitting ? 'Generando Conexión...' : 'Conectar por WhatsApp con Asesor NeXo'}</span>
                </button>

                {submitSuccess && (
                  <div className="submit-success-banner">
                    <CheckCircle2 size={16} />
                    <span>¡Conexión lista! Se ha abierto el canal con nuestro equipo comercial.</span>
                  </div>
                )}

              </form>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FOOTER ESTILO NEXO PAGE CON INFO NEXO RADAR */}
      <Footer />

      {/* 7. BOTÓN FLOTANTE STICKY PARA MÓVIL (MAX-CONVERSIÓN ANDROID) */}
      <div className={`mobile-sticky-bar ${showStickyCta ? 'visible' : ''}`}>
        <button 
          onClick={handleHeroSimulateClick}
          className="btn-mobile-sticky-simulate"
          title="Simular escaneo en vivo ahora"
        >
          <div className="btn-icon-pulse">
            <Zap size={18} />
          </div>
          <span>Simular Escaneo en Vivo</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* ESTILOS CSS REFACTORIZADOS (OPTIMIZACIÓN MÓVIL, GRID SIMÉTRICO Y LIMPIEZA TOTAL) */}
      <style>{`
        /* Raíz */
        .landing-root {
          background-color: #020617;
          color: #f8fafc;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          font-family: var(--font-family, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
          -webkit-font-smoothing: antialiased;
        }

        .landing-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Mallas de Fondo */
        .landing-grid-mesh {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }
        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.45;
        }
        .glow-top {
          top: -100px;
          left: 15%;
          width: 500px;
          height: 400px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
        }
        .glow-center {
          top: 800px;
          right: 10%;
          width: 600px;
          height: 500px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%);
        }

        /* 1. NAVBAR */
        .landing-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(2, 6, 23, 0.82);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 24px;
        }
        .brand-logo-wrapper {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .brand-logo-wrapper:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }
        .brand-clean-logo {
          height: 38px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        .header-right-group {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-left: auto;
        }
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-item {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          transition: color 0.2s ease;
          position: relative;
          white-space: nowrap;
          padding: 6px 0;
        }
        .nav-item:hover {
          color: #f8fafc;
        }
        .nav-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #06b6d4;
          transition: width 0.2s ease;
          border-radius: 2px;
        }
        .nav-item:hover::after {
          width: 100%;
        }

        .header-nav-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.12);
          flex-shrink: 0;
        }
        .header-actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .btn-console {
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.35);
          color: #06b6d4;
          padding: 9px 18px;
          border-radius: 12px;
          font-size: 0.86rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(6, 182, 212, 0.12);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-console:hover {
          background: rgba(6, 182, 212, 0.2);
          border-color: rgba(6, 182, 212, 0.65);
          color: #38bdf8;
          box-shadow: 0 4px 18px rgba(6, 182, 212, 0.35);
          transform: translateY(-1px);
        }
        .btn-console:active {
          transform: translateY(0);
        }
        .console-icon {
          color: #06b6d4;
          flex-shrink: 0;
        }

        /* 2. HERO */
        .hero-section {
          padding: 70px 0 60px;
          position: relative;
          z-index: 1;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 48px;
          align-items: center;
        }
        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.25);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.76rem;
          font-weight: 700;
          color: #06b6d4;
          letter-spacing: 0.04em;
          margin-bottom: 20px;
        }
        .live-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulseGreen 1.5s infinite;
        }
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .live-ping-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 2px 6px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.72rem;
        }

        .hero-headline {
          font-size: 3.1rem;
          font-weight: 850;
          line-height: 1.12;
          color: #f8fafc;
          letter-spacing: -0.03em;
          margin: 0 0 20px 0;
        }
        .headline-gradient {
          background: linear-gradient(135deg, #06b6d4 0%, #38bdf8 50%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subline {
          font-size: 1.05rem;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 32px 0;
          max-width: 580px;
        }
        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }

        /* Botón de Simulación Activo con Propósito Visual */
        .btn-hero-simulate {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 14px 26px;
          border-radius: 12px;
          font-size: 0.98rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.35);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-hero-simulate:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.55);
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
        }
        .btn-hero-simulate:active {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(6, 182, 212, 0.3);
        }
        .btn-icon-pulse {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: iconPulse 2s infinite ease-in-out;
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .btn-arrow {
          transition: transform 0.2s ease;
        }
        .btn-hero-simulate:hover .btn-arrow {
          transform: translateX(3px);
        }

        .btn-hero-secondary {
          background: rgba(15, 23, 42, 0.7);
          color: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.25);
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-hero-secondary:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(148, 163, 184, 0.4);
        }

        .hero-trust-bar {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: #cbd5e1;
        }

        /* MISSION CONTROL DASHBOARD CARD */
        .telemetry-card-glass {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.95) 100%);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(14px);
          position: relative;
        }
        .telemetry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
          gap: 12px;
        }
        .telemetry-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .radar-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-spin {
          animation: spinRadar 6s linear infinite;
        }
        @keyframes spinRadar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .telemetry-h3 {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #f8fafc;
        }
        .telemetry-stream-tag {
          font-size: 0.68rem;
          color: #06b6d4;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .telemetry-tabs {
          display: flex;
          gap: 6px;
          background: rgba(0,0,0,0.3);
          padding: 4px;
          border-radius: 10px;
        }
        .telemetry-tab-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .telemetry-tab-btn.active {
          background: rgba(6, 182, 212, 0.15);
          color: #06b6d4;
        }

        /* Radar Viewport Widget */
        .radar-viewport {
          height: 140px;
          background: radial-gradient(circle, #091a30 0%, #030a16 100%);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .radar-sweep-cone {
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(from 0deg, rgba(6, 182, 212, 0.25) 0deg, transparent 60deg);
          animation: radarSweep 4s linear infinite;
          transform-origin: center;
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-ring {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px dashed rgba(6, 182, 212, 0.25);
        }
        .ring-1 { width: 80px; height: 80px; }
        .ring-2 { width: 130px; height: 130px; }
        .radar-crosshair-h {
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: rgba(6, 182, 212, 0.15);
        }
        .radar-crosshair-v {
          position: absolute;
          left: 50%; top: 0; bottom: 0;
          width: 1px;
          background: rgba(6, 182, 212, 0.15);
        }
        .radar-blip-node {
          position: absolute;
          z-index: 2;
        }
        .blip-1 { top: 38%; left: 62%; }
        .blip-2 { top: 68%; left: 28%; }
        .blip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }
        .blip-dot.small {
          width: 5px; height: 5px; background: #06b6d4; opacity: 0.6;
        }
        .blip-ring {
          position: absolute;
          top: -4px; left: -4px;
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 1px solid #10b981;
          animation: ping 2s infinite;
        }
        .blip-card {
          position: absolute;
          left: 14px; top: -6px;
          background: rgba(2, 6, 23, 0.85);
          border: 1px solid rgba(16, 185, 129, 0.4);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.65rem;
          white-space: nowrap;
          display: flex;
          flex-direction: column;
        }
        .blip-card strong { color: #10b981; }
        .blip-card span { color: #94a3b8; }

        /* Bento de Métricas Digestibles */
        .telemetry-metrics-bento {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .metric-box-sub {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .metric-box-sub:hover {
          transform: translateY(-2px);
          border-color: rgba(6, 182, 212, 0.3);
        }
        .metric-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .metric-title {
          font-size: 0.72rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .metric-big-val {
          font-size: 1.55rem;
          font-weight: 850;
          color: #f8fafc;
          line-height: 1.15;
          margin-bottom: 4px;
        }
        .metric-desc-pill {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .metric-desc-pill.green { color: #10b981; }
        .metric-desc-pill.amber { color: #f59e0b; }
        .metric-desc-pill.blue { color: #38bdf8; }

        /* Flujo Explicativo en Tab 2 */
        .flow-explanation-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 16px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 14px;
          margin-bottom: 14px;
        }
        .flow-step-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }
        .flow-icon-circ {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .flow-step-text strong {
          display: block;
          font-size: 0.75rem;
          color: #f8fafc;
          margin-bottom: 2px;
        }
        .flow-step-text p {
          margin: 0;
          font-size: 0.68rem;
          color: #94a3b8;
          line-height: 1.3;
        }
        .flow-connector-arrow {
          opacity: 0.5;
        }
        .flow-status-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.78rem;
          color: #10b981;
          margin-bottom: 16px;
        }

        .telemetry-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
          gap: 10px;
        }
        .telemetry-status-ok {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: #94a3b8;
        }
        .btn-trigger-pulse {
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: #06b6d4;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-trigger-pulse:hover {
          background: rgba(6, 182, 212, 0.2);
        }

        /* 3. SECCIÓN ECOSISTEMA QR (DEMOSTRACIÓN INTERACTIVA) */
        .ecosystem-section {
          padding: 80px 0;
          position: relative;
          z-index: 1;
        }
        .section-pre-header {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 48px;
        }
        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: #06b6d4;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .section-title {
          font-size: 2.3rem;
          font-weight: 850;
          color: #f8fafc;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0 0 14px 0;
        }
        .section-desc {
          font-size: 0.98rem;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        .ecosystem-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 40px;
          align-items: flex-start;
        }

        /* LADO 1: SIMULADOR 3D INTERACTIVO */
        .simulator-canvas {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.75) 0%, rgba(2, 6, 23, 0.95) 100%);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 22px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        .signal-selector-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
          gap: 10px;
        }
        .selector-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .selector-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn-signal-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-signal-chip.active {
          background: rgba(6, 182, 212, 0.15);
          border-color: #06b6d4;
          color: #06b6d4;
        }

        /* Escenario de Simulación con Profundidad 3D Isométrica y Solapamiento Realista */
        .simulation-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 420px;
          padding: 30px 10px;
          background: radial-gradient(circle at 45% 45%, rgba(6, 182, 212, 0.12) 0%, rgba(2, 6, 23, 0.95) 75%);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          perspective: 1100px;
          perspective-origin: 50% 48%;
        }

        /* Terminal Física QR (Plano de Fondo Inclinado en Perspectiva 3D) */
        .physical-terminal {
          width: 210px;
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid rgba(148, 163, 184, 0.25);
          border-radius: 22px;
          padding: 18px;
          position: relative;
          box-shadow: -20px 25px 50px rgba(0, 0, 0, 0.75), 0 0 20px rgba(6, 182, 212, 0.15);
          transition: all 0.4s ease;
          z-index: 2;
          transform: rotateY(14deg) rotateX(5deg);
          transform-style: preserve-3d;
          margin-right: -45px;
        }
        .terminal-connected {
          border-color: #10b981;
          box-shadow: 0 0 45px rgba(16, 185, 129, 0.45);
        }
        .terminal-led-ring {
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 5px;
          border-radius: 3px;
          transition: all 0.3s;
        }
        .led-standby { background: #475569; }
        .led-reading { 
          background: #06b6d4; 
          box-shadow: 0 0 12px #06b6d4; 
          animation: pulseCyan 0.6s infinite alternate; 
        }
        .led-connected { 
          background: #10b981; 
          box-shadow: 0 0 18px #10b981; 
        }
        @keyframes pulseCyan {
          from { opacity: 0.4; } to { opacity: 1; }
        }

        .terminal-case-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .terminal-brand {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.62rem;
          font-weight: 800;
          color: #94a3b8;
        }
        .brand-dot-matrix {
          width: 6px; height: 6px; border-radius: 50%; background: #06b6d4;
        }
        .terminal-signal-bars {
          display: flex; gap: 2px; align-items: flex-end; height: 10px;
        }
        .terminal-signal-bars .bar {
          width: 3px; background: #475569; border-radius: 1px;
        }
        .terminal-signal-bars .bar:nth-child(1) { height: 35%; }
        .terminal-signal-bars .bar:nth-child(2) { height: 65%; }
        .terminal-signal-bars .bar:nth-child(3) { height: 95%; }
        .terminal-signal-bars .bar.active { background: #10b981; }

        .terminal-oled-screen {
          background: #020617;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px;
          font-family: monospace;
          font-size: 0.66rem;
          color: #38bdf8;
          min-height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          text-align: center;
        }
        .oled-content { display: flex; align-items: center; gap: 5px; }
        .oled-content.connected { color: #10b981; font-weight: 700; }

        .terminal-qr-plate {
          background: #020617;
          border: 2px solid rgba(6, 182, 212, 0.4);
          border-radius: 14px;
          padding: 12px;
          text-align: center;
          position: relative;
        }
        .qr-box-inner {
          display: inline-block;
          position: relative;
        }
        .laser-sweep-line {
          position: absolute;
          left: 0; right: 0; height: 3px;
          background: #06b6d4;
          box-shadow: 0 0 14px #06b6d4, 0 0 4px #ffffff;
          animation: sweepVertical 1.2s infinite alternate ease-in-out;
        }
        @keyframes sweepVertical {
          0% { top: 0%; }
          100% { top: 95%; }
        }
        .qr-serial-code {
          display: block;
          margin-top: 8px;
          font-size: 0.64rem;
          font-family: monospace;
          color: #64748b;
        }
        .terminal-base-foot {
          margin-top: 10px;
          text-align: center;
          font-size: 0.58rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.06em;
        }

        /* Proyección Láser Volumétrica entre Dispositivos */
        .laser-cone-projection {
          position: absolute;
          left: 40%;
          top: 36%;
          width: 140px;
          height: 95px;
          background: radial-gradient(ellipse at center, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0.12) 60%, transparent 100%);
          clip-path: polygon(0 15%, 100% 35%, 100% 65%, 0 85%);
          transform: rotate(10deg);
          pointer-events: none;
          z-index: 4;
          animation: pulseLaserCone 1.2s infinite alternate ease-in-out;
        }
        @keyframes pulseLaserCone {
          from { opacity: 0.65; transform: rotate(9deg) scale(0.97); }
          to { opacity: 1; transform: rotate(11deg) scale(1.03); }
        }

        /* Smartphone Renderizado (Superpuesto en Primer Plano con Ángulo Isométrico 3D) */
        .smartphone-mockup {
          width: 195px;
          height: 345px;
          background: #0f172a;
          border: 3.5px solid #334155;
          border-radius: 32px;
          padding: 8px;
          position: relative;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(6, 182, 212, 0.25);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 5;
          transform-style: preserve-3d;
          margin-left: -40px;
        }
        .smartphone-mockup.pos-idle {
          transform: rotateY(-18deg) rotateX(10deg) rotateZ(-6deg) translate3d(25px, 15px, 40px);
        }
        .smartphone-mockup.pos-approaching,
        .smartphone-mockup.pos-scanning {
          transform: rotateY(-12deg) rotateX(7deg) rotateZ(-3deg) translate3d(-45px, -15px, 95px) scale(1.06);
          border-color: #06b6d4;
          box-shadow: 0 0 45px rgba(6, 182, 212, 0.55), 0 25px 60px rgba(0, 0, 0, 0.9);
        }
        .smartphone-mockup.pos-authorized,
        .smartphone-mockup.pos-dispatched {
          transform: rotateY(-8deg) rotateX(5deg) rotateZ(-2deg) translate3d(-25px, -5px, 70px) scale(1.02);
          border-color: #10b981;
          box-shadow: 0 0 45px rgba(16, 185, 129, 0.55), 0 25px 60px rgba(0, 0, 0, 0.9);
        }
        .phone-outer-frame {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .phone-notch {
          width: 54px;
          height: 6px;
          background: #1e293b;
          border-radius: 4px;
          margin: 0 auto 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .camera-lens {
          width: 3px; height: 3px; border-radius: 50%; background: #06b6d4;
        }
        .speaker-ear {
          width: 18px; height: 2px; border-radius: 1px; background: #475569;
        }

        .phone-screen-oled {
          background: #020617;
          border-radius: 22px;
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .phone-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px;
          text-align: center;
        }
        .cam-viewfinder {
          width: 100px;
          height: 100px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .cam-viewfinder .corner {
          position: absolute;
          width: 12px; height: 12px;
          border-color: #06b6d4;
          border-style: solid;
        }
        .corner.top-left { top: 0; left: 0; border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
        .corner.top-right { top: 0; right: 0; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
        .corner.btm-left { bottom: 0; left: 0; border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
        .corner.btm-right { bottom: 0; right: 0; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }
        .cam-hint { font-size: 0.62rem; color: #94a3b8; }
        
        .btn-trigger-scan {
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid #06b6d4;
          color: #06b6d4;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
        }
        .phone-laser-line {
          position: absolute;
          left: 0; right: 0; height: 2px;
          background: #06b6d4;
          box-shadow: 0 0 8px #06b6d4;
          animation: laserSweep 1s infinite alternate;
        }
        .cam-reading {
          font-size: 0.62rem;
          color: #06b6d4;
          font-family: monospace;
          margin-top: 75px;
        }
        .phone-state.success {
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
        }
        .success-icon-badge {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }
        .success-h4 {
          margin: 0;
          font-size: 0.86rem;
          font-weight: 800;
          color: #10b981;
        }
        .success-tag {
          font-size: 0.62rem;
          font-weight: 700;
          color: #38bdf8;
          margin-bottom: 6px;
        }
        .success-node {
          font-size: 0.62rem;
          color: #94a3b8;
          margin: 0 0 10px;
        }
        .dispatch-preview-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 8px;
          width: 90%;
        }
        .chip-type {
          display: block; font-size: 0.65rem; font-weight: 700; color: #f8fafc;
        }
        .chip-sent {
          display: block; font-size: 0.58rem; color: #10b981; margin-top: 2px;
        }

        .stage-controls {
          margin-top: 20px;
          text-align: center;
        }
        .btn-run-simulation {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid #06b6d4;
          color: #06b6d4;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-run-simulation:hover {
          background: rgba(6, 182, 212, 0.22);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.35);
        }

        /* LADO 2: LÍNEA DE TIEMPO INTERACTIVA (GRID SIMÉTRICO PERFECTO) */
        .operational-timeline {
          padding-left: 10px;
        }
        .timeline-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #f8fafc;
          margin: 0 0 6px;
        }
        .timeline-subtitle {
          font-size: 0.9rem;
          color: #cbd5e1;
          margin: 0 0 28px;
          line-height: 1.5;
        }

        /* Contenedor con Alineación Sólida (Elimina desalineación de los números 1, 2, 3) */
        .timeline-steps-container {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .timeline-step-row {
          display: flex;
          align-items: stretch;
          gap: 16px;
          position: relative;
        }
        .step-marker-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 44px;
          flex-shrink: 0;
        }
        .step-marker-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #0f172a;
          border: 2px solid rgba(148, 163, 184, 0.25);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1;
          font-size: 0.96rem;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          transition: all 0.3s;
          flex-shrink: 0;
          z-index: 2;
        }
        .timeline-step-row.active .step-marker-circle {
          border-color: #06b6d4;
          color: #06b6d4;
          background: rgba(6, 182, 212, 0.15);
          box-shadow: 0 0 16px rgba(6, 182, 212, 0.45);
        }
        .timeline-step-row.completed .step-marker-circle {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
        }
        .step-connector-track {
          width: 2px;
          flex: 1;
          min-height: 32px;
          background: rgba(148, 163, 184, 0.15);
          margin: 4px 0;
        }

        .step-content-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 18px;
          flex: 1;
          transition: all 0.25s;
        }
        .timeline-step-row.active .step-content-card {
          border-color: rgba(6, 182, 212, 0.35);
          background: rgba(15, 23, 42, 0.85);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        .step-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          flex-wrap: wrap;
          gap: 6px;
        }
        .step-name {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 750;
          color: #f8fafc;
        }
        .step-pill {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(6, 182, 212, 0.14);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: #38bdf8;
          letter-spacing: 0.02em;
        }
        .step-pill.green { 
          color: #34d399; 
          background: rgba(16, 185, 129, 0.16); 
          border-color: rgba(16, 185, 129, 0.32);
        }
        .step-pill.blue { 
          color: #60a5fa; 
          background: rgba(59, 130, 246, 0.16); 
          border-color: rgba(59, 130, 246, 0.32);
        }
        .step-description {
          margin: 0;
          font-size: 0.84rem;
          color: #cbd5e1;
          line-height: 1.55;
        }

        .timeline-collaborator-callout {
          margin-top: 10px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: rgba(6, 182, 212, 0.07);
          border: 1px solid rgba(6, 182, 212, 0.22);
          border-radius: 14px;
          padding: 16px;
        }
        .callout-icon-box {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .callout-title {
          margin: 0 0 4px;
          font-size: 0.88rem;
          font-weight: 800;
          color: #f8fafc;
        }
        .callout-desc {
          margin: 0;
          font-size: 0.82rem;
          color: #cbd5e1;
          line-height: 1.5;
        }
        .callout-desc strong { color: #06b6d4; }

        /* 4. BENTO GRID DE CAPACIDADES (OPTIMIZADO EN MÓVIL: 2 COLUMNAS) */
        .bento-section {
          padding: 70px 0;
          position: relative;
          z-index: 1;
        }
        .bento-responsive-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .bento-card-wide {
          grid-column: span 2;
        }
        .bento-card-wide-2 {
          grid-column: span 2;
        }
        .bento-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 18px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        .bento-card:hover {
          transform: translateY(-3px);
          border-color: rgba(6, 182, 212, 0.35);
        }
        .bento-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .bento-icon-box.cyan { background: rgba(6, 182, 212, 0.12); color: #06b6d4; }
        .bento-icon-box.amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .bento-icon-box.blue { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .bento-icon-box.emerald { background: rgba(16, 185, 129, 0.12); color: #10b981; }

        .bento-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #06b6d4;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }
        .bento-h3 {
          margin: 0 0 10px;
          font-size: 1.18rem;
          font-weight: 800;
          color: #f8fafc;
        }
        .bento-p {
          margin: 0 0 16px;
          font-size: 0.88rem;
          color: #cbd5e1;
          line-height: 1.6;
          flex: 1;
        }
        .bento-data-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.76rem;
          color: #e2e8f0;
          font-weight: 600;
        }

        /* 5. CONTACTO */
        .contact-section {
          padding: 60px 0 80px;
          position: relative;
          z-index: 1;
        }
        .contact-wrapper-card {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 24px;
          padding: 44px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .contact-headline {
          font-size: 2.1rem;
          font-weight: 850;
          line-height: 1.2;
          color: #f8fafc;
          margin: 12px 0 16px;
        }
        .contact-p {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .quick-whatsapp-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 14px 18px;
          border-radius: 14px;
          text-decoration: none;
          margin-bottom: 14px;
          transition: transform 0.2s, background 0.2s;
        }
        .quick-whatsapp-card:hover {
          transform: translateY(-2px);
          background: rgba(16, 185, 129, 0.14);
        }
        .wa-label { display: block; font-size: 0.74rem; color: #94a3b8; }
        .wa-number { display: block; font-size: 1.05rem; font-weight: 800; color: #10b981; }
        .coverage-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #94a3b8;
        }

        /* Formulario */
        .controlled-form {
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 28px;
        }
        .form-h3 {
          margin: 0 0 4px;
          font-size: 1.25rem;
          font-weight: 800;
          color: #f8fafc;
        }
        .form-subtitle {
          margin: 0 0 20px;
          font-size: 0.86rem;
          color: #cbd5e1;
        }
        .form-group {
          margin-bottom: 18px;
          transition: all 0.2s ease;
        }
        .form-group:focus-within .form-lbl {
          color: #38bdf8;
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.45);
        }
        .form-lbl {
          display: block;
          font-size: 0.76rem;
          font-weight: 750;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #cbd5e1;
          margin-bottom: 6px;
          transition: color 0.2s ease, text-shadow 0.2s ease;
        }
        .form-input-styled {
          width: 100%;
          min-height: 48px;
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.85);
          border: 1.5px solid rgba(148, 163, 184, 0.26);
          border-radius: 12px;
          color: #f8fafc;
          font-size: 0.94rem;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, transform 0.2s ease;
        }
        .form-input-styled:hover {
          border-color: rgba(6, 182, 212, 0.45);
        }
        .form-input-styled:focus {
          border-color: #06b6d4 !important;
          background: rgba(15, 23, 42, 0.98) !important;
          box-shadow: 0 0 0 3.5px rgba(6, 182, 212, 0.35), 0 0 22px rgba(6, 182, 212, 0.28), inset 0 0 8px rgba(6, 182, 212, 0.08) !important;
          outline: none !important;
          transform: translateY(-1px);
        }
        .form-input-styled.error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3.5px rgba(239, 68, 68, 0.25) !important;
        }
        .fleet-selector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .fleet-btn {
          min-height: 44px;
          min-width: 44px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #94a3b8;
          padding: 10px 8px;
          border-radius: 10px;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fleet-btn:focus-visible {
          outline: none;
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.3);
        }
        .fleet-btn.active {
          background: rgba(6, 182, 212, 0.18);
          border-color: #06b6d4;
          color: #06b6d4;
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.25);
        }
        .btn-submit-contact {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 750;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .btn-submit-contact:hover {
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
          transform: translateY(-1px);
        }
        .submit-success-banner {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 10px;
          color: #10b981;
          font-size: 0.82rem;
        }

        /* 6. FOOTER CORPORATIVO ULTRA LIMPIO (SIN TEXTO DUPLICADO) */
        .landing-footer {
          background: #01040d;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 60px 0 28px;
          position: relative;
          z-index: 1;
        }
        .footer-cols-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
          gap: 36px;
          margin-bottom: 48px;
        }
        .footer-logo-box {
          margin-bottom: 14px;
        }
        .footer-clean-logo {
          height: 38px;
          width: auto;
          object-fit: contain;
          display: block;
        }
        .footer-p {
          font-size: 0.86rem;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 320px;
        }
        .footer-col-title {
          margin: 0 0 18px;
          font-size: 0.78rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: 0.06em;
        }
        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 4px 0;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: #06b6d4;
        }
        .icon-link {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-text-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #94a3b8;
          min-height: 38px;
        }
        .footer-login-btn {
          margin-top: 18px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: #06b6d4;
          padding: 10px 18px;
          min-height: 44px;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .footer-login-btn:hover {
          background: rgba(6, 182, 212, 0.2);
          transform: translateX(2px);
        }

        .footer-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin-bottom: 24px;
        }
        .footer-bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
          color: #64748b;
          flex-wrap: wrap;
          gap: 12px;
        }
        .developer-signature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        .dev-brand {
          color: #06b6d4;
        }
        .dev-pipe {
          opacity: 0.4;
        }
        .dev-author {
          color: #f8fafc;
        }

        /* ========================================================
           INDICADORES Y ELEMENTOS MOBILE-FIRST (SWIPE Y STICKY CTA)
           ======================================================== */
        .mobile-carousel-indicators {
          display: none;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
        }
        .carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: rgba(148, 163, 184, 0.3);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .carousel-dot.active {
          width: 26px;
          background: #06b6d4;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
        }

        /* Barra Sticky Flotante en Móvil */
        .mobile-sticky-bar {
          display: none;
        }

        /* ========================================================
           RESPONSIVIDAD Y OPTIMIZACIÓN MOBILE-FIRST (ANDROID UX)
           ======================================================== */
        @media (max-width: 992px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .ecosystem-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .contact-wrapper-card {
            grid-template-columns: 1fr;
            padding: 28px;
            gap: 32px;
          }
          .footer-cols-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px;
          }
        }

        @media (max-width: 768px) {
          /* Espaciado de página con espacio para la barra sticky inferior */
          .landing-root {
            padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
            overflow-x: hidden;
            width: 100%;
          }

          .landing-container {
            padding: 0 16px;
            width: 100%;
            box-sizing: border-box;
          }

          .desktop-nav, .header-nav-divider {
            display: none;
          }
          .header-brand {
            gap: 8px;
          }
          .header-logo-img {
            height: 32px;
            width: auto;
          }
          .btn-console {
            min-height: 42px;
            padding: 8px 13px;
            font-size: 0.78rem;
            white-space: nowrap;
          }

          /* 1. HERO Y CTA ABOVE THE FOLD (COMPACTO Y VISIBLE EN ANDROID) */
          .hero-section {
            padding: 20px 0 18px;
          }
          .live-status-pill {
            margin-bottom: 12px;
            font-size: 0.68rem;
            padding: 5px 10px;
            max-width: 100%;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
            text-align: center;
          }
          .hero-headline {
            font-size: clamp(1.65rem, 5.5vw, 2.1rem);
            line-height: 1.18;
            letter-spacing: -0.02em;
            margin-bottom: 12px;
            text-wrap: balance;
            word-break: break-word;
          }
          .hero-subline {
            font-size: 0.88rem;
            line-height: 1.5;
            margin-bottom: 18px;
          }
          .hero-cta-group {
            gap: 10px;
            margin-bottom: 18px;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .btn-hero-simulate {
            min-height: 48px;
            padding: 12px 20px;
            font-size: 0.94rem;
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
          }
          .btn-hero-secondary {
            min-height: 46px;
            padding: 10px 18px;
            font-size: 0.88rem;
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
          }
          .hero-trust-bar {
            gap: 8px;
            font-size: 0.78rem;
            flex-direction: column;
            align-items: flex-start;
          }

          /* Telemetría Console en Móvil */
          .telemetry-card-glass {
            padding: 16px 14px;
            border-radius: 18px;
            width: 100%;
            box-sizing: border-box;
          }
          .telemetry-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .telemetry-tabs {
            width: 100%;
            display: flex;
          }
          .telemetry-tab-btn {
            flex: 1;
            text-align: center;
            min-height: 38px;
            padding: 6px 10px;
            font-size: 0.76rem;
          }
          .telemetry-metrics-bento {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .metric-box-sub {
            padding: 10px 10px;
          }
          .metric-big-val {
            font-size: 1.25rem;
          }

          /* 2. BOTÓN STICKY FLOTANTE INFERIOR (MÓVIL / CONVERSIÓN MÁXIMA) */
          .mobile-sticky-bar {
            display: block;
            position: fixed;
            bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            left: 12px;
            right: 12px;
            width: auto;
            max-width: calc(100% - 24px);
            box-sizing: border-box;
            z-index: 9999;
            pointer-events: none;
            transform: translateY(140%);
            opacity: 0;
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          }
          .mobile-sticky-bar.visible {
            pointer-events: auto;
            transform: translateY(0);
            opacity: 1;
          }
          .btn-mobile-sticky-simulate {
            width: 100%;
            min-height: 50px;
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 14px;
            font-size: 0.94rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(6, 182, 212, 0.45), 0 4px 14px rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(12px);
            transition: transform 0.15s ease;
            box-sizing: border-box;
          }
          .btn-mobile-sticky-simulate:active {
            transform: scale(0.98);
          }

          /* 3. JERARQUÍA TIPOGRÁFICA Y ESPACIADOS DE SECCIÓN */
          .section-pre-header {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: clamp(1.35rem, 4.5vw, 1.65rem);
            line-height: 1.25;
            letter-spacing: -0.015em;
            margin-bottom: 10px;
            text-wrap: balance;
          }
          .section-desc {
            font-size: 0.85rem;
            line-height: 1.5;
          }
          .timeline-title {
            font-size: 1.2rem;
            margin-bottom: 6px;
          }
          .timeline-subtitle {
            font-size: 0.82rem;
            margin-bottom: 16px;
          }

          /* 4. DEMOSTRACIÓN QR: ESCENARIO INTEGRADO Y FLUIDO (AMBOS DISPOSITIVOS VISIBLES) */
          .ecosystem-section {
            padding: 36px 0 40px;
          }
          .simulator-canvas {
            padding: 16px 12px 20px;
            border-radius: 20px;
            width: 100%;
            box-sizing: border-box;
          }
          .signal-selector-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 14px;
            padding-bottom: 10px;
          }
          .selector-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            width: 100%;
          }
          .btn-signal-chip {
            flex: 1 1 auto;
            min-height: 40px;
            padding: 6px 10px;
            font-size: 0.72rem;
            text-align: center;
          }
          .simulation-stage {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: auto !important;
            height: auto !important;
            padding: 22px 12px 26px !important;
            gap: 14px !important;
            overflow: hidden !important;
            background: radial-gradient(circle at 50% 35%, rgba(6, 182, 212, 0.16) 0%, rgba(2, 6, 23, 0.98) 75%) !important;
            border-radius: 20px !important;
            perspective: 1000px !important;
            position: relative !important;
            box-sizing: border-box !important;
          }
          .physical-terminal {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 220px !important;
            padding: 14px !important;
            margin: 0 auto !important;
            transform: rotateX(6deg) !important;
            box-shadow: 0 14px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.15) !important;
            z-index: 2 !important;
            box-sizing: border-box !important;
          }
          .terminal-qr-plate {
            padding: 10px !important;
          }
          .qr-box-inner svg {
            width: 88px !important;
            height: 88px !important;
          }
          .terminal-oled-screen {
            min-height: 30px !important;
            font-size: 0.64rem !important;
            padding: 5px !important;
            margin-bottom: 10px !important;
          }
          .smartphone-mockup {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            max-width: 215px !important;
            height: 275px !important;
            margin: -22px auto 0 !important;
            z-index: 6 !important;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(6, 182, 212, 0.35) !important;
            border: 3px solid #334155 !important;
            border-radius: 28px !important;
            transform: rotateX(4deg) translateY(-5px) scale(1.02) !important;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
            box-sizing: border-box !important;
          }
          .smartphone-mockup.pos-idle {
            transform: rotateX(4deg) translateY(-5px) scale(1) !important;
          }
          .smartphone-mockup.pos-approaching,
          .smartphone-mockup.pos-scanning {
            transform: rotateX(2deg) translateY(-18px) scale(1.05) !important;
            border-color: #06b6d4 !important;
            box-shadow: 0 0 35px rgba(6, 182, 212, 0.6) !important;
          }
          .smartphone-mockup.pos-authorized,
          .smartphone-mockup.pos-dispatched {
            transform: rotateX(0deg) translateY(-10px) scale(1.02) !important;
            border-color: #10b981 !important;
            box-shadow: 0 0 35px rgba(16, 185, 129, 0.6) !important;
          }
          .laser-cone-projection {
            display: block !important;
            position: absolute !important;
            left: 50% !important;
            top: 42% !important;
            transform: translate(-50%, -50%) rotate(90deg) !important;
            width: 130px !important;
            height: 90px !important;
            background: radial-gradient(ellipse at center, rgba(6, 182, 212, 0.6) 0%, transparent 80%) !important;
            z-index: 4 !important;
            pointer-events: none !important;
          }
          .stage-controls {
            margin-top: 14px;
            width: 100%;
          }
          .stage-controls .btn-run-simulation {
            width: 100%;
            min-height: 48px;
            justify-content: center;
            font-size: 0.9rem;
            box-sizing: border-box;
          }

          /* Tablet/Fold landscape para el simulador */
          @media (min-width: 520px) and (max-width: 768px) {
            .simulation-stage {
              flex-direction: row !important;
              gap: 20px !important;
              padding: 24px 20px !important;
            }
            .smartphone-mockup {
              margin: 0 !important;
            }
            .laser-cone-projection {
              transform: translate(-50%, -50%) rotate(0deg) !important;
              top: 50% !important;
            }
          }

          /* 5. SECUENCIA DE PASOS: TIMELINE VERTICAL FLUIDO (SIN CORTES HORIZONTALES) */
          .operational-timeline {
            padding-left: 0;
            width: 100%;
          }
          .timeline-steps-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .timeline-step-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 12px !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .step-marker-col {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 38px !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
          }
          .step-marker-circle {
            width: 36px !important;
            height: 36px !important;
            font-size: 0.86rem !important;
            border-radius: 50% !important;
            flex-shrink: 0 !important;
          }
          .step-connector-track {
            display: block !important;
            width: 2px !important;
            flex: 1 !important;
            min-height: 44px !important;
            background: rgba(6, 182, 212, 0.25) !important;
            margin: 4px 0 !important;
          }
          .step-content-card {
            flex: 1 !important;
            width: 100% !important;
            margin-bottom: 0 !important;
            min-height: auto !important;
            padding: 14px 16px !important;
            box-sizing: border-box !important;
            border-radius: 14px !important;
          }
          .step-card-header {
            margin-bottom: 6px;
            gap: 6px;
          }
          .step-name {
            font-size: 0.92rem;
          }
          .step-description {
            font-size: 0.82rem;
            line-height: 1.5;
          }
          .timeline-collaborator-callout {
            margin-top: 16px;
            padding: 14px 16px;
            box-sizing: border-box;
            width: 100%;
          }

          /* 6. BENTO GRID: COMPOSICIÓN DINÁMICA 2 COLUMNAS (ALTO RENDIMIENTO) */
          .bento-section {
            padding: 36px 0;
          }
          .bento-responsive-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .bento-card {
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 16px 14px !important;
            border-radius: 16px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .bento-card-wide {
            grid-column: span 2 !important;
            padding: 18px 16px !important;
          }
          .bento-card-wide-2 {
            grid-column: span 2 !important;
            padding: 18px 16px !important;
          }
          .bento-icon-box {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
            margin-bottom: 12px !important;
          }
          .bento-icon-box svg {
            width: 20px !important;
            height: 20px !important;
          }
          .bento-tag {
            font-size: 0.62rem !important;
            margin-bottom: 4px !important;
            letter-spacing: 0.05em !important;
          }
          .bento-h3 {
            font-size: 0.98rem !important;
            line-height: 1.25 !important;
            margin-bottom: 6px !important;
          }
          .bento-p {
            font-size: 0.78rem !important;
            line-height: 1.45 !important;
            margin-bottom: 10px !important;
          }
          .bento-data-chip {
            padding: 4px 8px !important;
            font-size: 0.68rem !important;
            gap: 4px !important;
            border-radius: 6px !important;
            margin-top: auto !important;
            width: fit-content !important;
            max-width: 100% !important;
          }
          .bento-data-chip span {
            white-space: normal !important;
            word-break: normal !important;
          }
          .mobile-carousel-indicators {
            display: none !important;
          }

          /* 7. SELECTOR DE FLOTA: 2X2 CON TOUCH TARGETS AMPLIOS */
          .fleet-selector-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          /* 8. SECCIÓN CONTACTO */
          .contact-section {
            padding: 36px 0 54px;
          }
          .contact-wrapper-card {
            grid-template-columns: 1fr;
            padding: 20px 16px;
            gap: 22px;
            border-radius: 20px;
            box-sizing: border-box;
          }
          .contact-headline {
            font-size: clamp(1.35rem, 4.5vw, 1.6rem);
            line-height: 1.25;
            text-wrap: balance;
          }
          .contact-p {
            font-size: 0.85rem;
            line-height: 1.5;
            margin-bottom: 18px;
          }
          .quick-whatsapp-card {
            min-height: 54px;
            padding: 12px 14px;
            width: 100%;
            box-sizing: border-box;
          }
          .coverage-badge {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
            font-size: 0.78rem;
          }
          .controlled-form {
            padding: 18px 14px;
            border-radius: 16px;
            box-sizing: border-box;
          }
          .form-h3 {
            font-size: 1.12rem;
          }
          .form-input-styled {
            min-height: 46px;
            box-sizing: border-box;
            width: 100%;
          }
          .btn-submit-contact {
            min-height: 50px;
            font-size: 0.92rem;
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
          }


        }
      `}</style>
    </div>
  );
}
