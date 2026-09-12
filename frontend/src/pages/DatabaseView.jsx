import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Database, Download, Search, Filter, Phone, MapPin, 
  User, Building2, QrCode, FileText, Printer, Check, 
  Copy, ExternalLink, RefreshCw, Layers, ShieldCheck, 
  Sparkles, AlertCircle, X, ChevronDown, CheckCircle2, ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/Modal';

export default function DatabaseView() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);
  const [copiedToken, setCopiedToken] = useState(null);
  
  // Modal de visualización / impresión de QR individual
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Modal para visualización y Exportación de Lote de QRs
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchStart, setBatchStart] = useState(1);
  const [batchCount, setBatchCount] = useState(24);
  const [customDomain, setCustomDomain] = useState(window.location.origin);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBusinesses = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:5000/api/businesses')
      .then(res => {
        setBusinesses(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando base de datos:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Lista de ciudades únicas para filtro
  const cities = ['ALL', ...Array.from(new Set(businesses.map(b => b.city).filter(Boolean)))];

  // Filtrado reactivo
  const filteredData = businesses.filter(b => {
    const matchesCity = selectedCity === 'ALL' || b.city === selectedCity;
    if (!matchesCity) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.business_name || '').toLowerCase().includes(q) ||
      (b.owner_name || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      (b.qr_token || '').toLowerCase().includes(q)
    );
  });

  const copyQrUrl = (token, e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/qr/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const openQrModal = (biz) => {
    setSelectedBusiness(biz);
    setQrModalOpen(true);
  };

  // EXPORTACIÓN A PDF PROFESIONAL CON jsPDF Y AUTO-TABLE
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Encabezado con Membrete NeXo Radar
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NeXo Radar - Directorio Maestro de Clientes y Terminales', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94a3b8
    const fechaHora = new Date().toLocaleString('es-CO');
    doc.text(`Generado: ${fechaHora}  |  Total Registros: ${filteredData.length}`, 215, 15);

    // Preparar filas de la tabla
    const tableRows = filteredData.map((b, index) => [
      index + 1,
      b.business_name || 'Sin nombre',
      b.owner_name || 'No especificado',
      b.phone || 'Sin contacto',
      b.city || 'Desconocida',
      b.address || 'Sin dirección registrada',
      `#${b.qr_token || '---'}`,
      b.created_at ? new Date(b.created_at).toLocaleDateString('es-CO') : 'Activo'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Establecimiento', 'Dueño / Titular', 'Teléfono', 'Ciudad', 'Dirección', 'Token QR', 'Fecha Alta']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [2, 132, 199], // #0284c7 NeXo Blue
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // #f8fafc
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 42 },
        3: { cellWidth: 32 },
        4: { cellWidth: 30 },
        5: { cellWidth: 65 },
        6: { cellWidth: 26, halign: 'center', textColor: [2, 132, 199], fontStyle: 'bold' },
        7: { cellWidth: 26, halign: 'center' }
      },
      didDrawPage: (data) => {
        // Pie de página oficial
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Documento Confidencial · NeXo Radar SaaS · Página ${data.pageNumber}`,
          14,
          doc.internal.pageSize.height - 8
        );
      }
    });

    // Descargar archivo
    doc.save(`NeXo_Radar_Base_Datos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // EXPORTACIÓN DE QRS EN PDF VECTORIAL DE ALTO RENDIMIENTO (12 QRs POR HOJA A4)
  const exportBatchQrPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress(0);

    try {
      // Yield inicial para que la UI pinte de inmediato el spinner
      await new Promise(r => setTimeout(r, 50));

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const totalCards = batchCount;
      const cardsPerPage = 12;
      const totalPages = Math.ceil(totalCards / cardsPerPage);

      // Cuadrícula matemática: 3 columnas x 4 filas en A4 (210mm x 297mm)
      const cardWidth = 58;
      const cardHeight = 63;
      const gapX = 5;
      const gapY = 6;
      const marginLeft = 13;
      const marginTop = 13.5;

      for (let i = 0; i < totalCards; i++) {
        const pageIndex = Math.floor(i / cardsPerPage);
        const cardIndexOnPage = i % cardsPerPage;

        // Añadir nueva página cada 12 tarjetas
        if (cardIndexOnPage === 0 && i > 0) {
          doc.addPage();
          // Ceder el control al navegador cada hoja para mantener la interfaz 100% fluida
          await new Promise(r => setTimeout(r, 0));
        }

        const col = cardIndexOnPage % 3;
        const row = Math.floor(cardIndexOnPage / 3);

        const x = marginLeft + col * (cardWidth + gapX);
        const y = marginTop + row * (cardHeight + gapY);

        const tokenNumber = batchStart + i;
        const formattedToken = String(tokenNumber).padStart(3, '0');
        const businessLinked = businesses.find(b => b.qr_token === formattedToken || b.qr_token === String(tokenNumber));
        const finalQrUrl = `${customDomain.replace(/\/$/, '')}/qr/${formattedToken}`;

        // 1. Marco exterior con esquinas redondeadas
        doc.setDrawColor(203, 213, 225); // #cbd5e1
        doc.setLineWidth(0.35);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardWidth, cardHeight, 3.5, 3.5, 'FD');

        // 2. Código del Token arriba a la izquierda (SIN la palabra "DISPONIBLE")
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // #0f172a
        doc.text(`#${formattedToken}`, x + 5, y + 7.5);

        // 3. Recuadro interior suave para el QR
        const qrBoxSize = 42;
        const qrBoxX = x + (cardWidth - qrBoxSize) / 2;
        const qrBoxY = y + 10;
        doc.setDrawColor(226, 232, 240); // #e2e8f0
        doc.setLineWidth(0.2);
        doc.setFillColor(248, 250, 252); // #f8fafc
        doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 2.5, 2.5, 'FD');

        // 4. Generación vectorial ultra-rápida (sin canvas pesados ni fugas de RAM)
        const qr = QRCode.create(finalQrUrl, { errorCorrectionLevel: 'M' });
        const size = qr.modules.size;
        const qrSize = 38;
        const moduleMm = qrSize / size;
        const qrX = qrBoxX + (qrBoxSize - qrSize) / 2;
        const qrY = qrBoxY + (qrBoxSize - qrSize) / 2;

        doc.setFillColor(15, 23, 42); // Módulos negros/azul oscuro

        // Dibujado por compresión de segmentos contiguos (ultra eficiente)
        for (let r = 0; r < size; r++) {
          let startC = -1;
          for (let c = 0; c < size; c++) {
            if (qr.modules.get(r, c)) {
              if (startC === -1) startC = c;
            } else {
              if (startC !== -1) {
                doc.rect(qrX + startC * moduleMm, qrY + r * moduleMm, (c - startC) * moduleMm, moduleMm, 'F');
                startC = -1;
              }
            }
          }
          if (startC !== -1) {
            doc.rect(qrX + startC * moduleMm, qrY + r * moduleMm, (size - startC) * moduleMm, moduleMm, 'F');
          }
        }

        // 5. Pie de tarjeta: "NeXo Radar Física" o nombre del comercio
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59); // #1e293b
        const bottomText = businessLinked?.business_name ? businessLinked.business_name.slice(0, 25) : 'NeXo Radar Física';
        doc.text(bottomText, x + cardWidth / 2, y + 58, { align: 'center' });

        // 6. Pie de página institucional al final de cada hoja A4
        if (cardIndexOnPage === cardsPerPage - 1 || i === totalCards - 1) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`NeXo Radar · Pliego Oficial de Códigos QR · Hoja ${pageIndex + 1} de ${totalPages} (12 QRs por hoja)`, 105, 292, { align: 'center' });
        }

        // Actualizar porcentaje de progreso
        setPdfProgress(Math.round(((i + 1) / totalCards) * 100));
      }

      const endToken = batchStart + totalCards - 1;
      doc.save(`NeXo_Radar_QRs_${batchStart}_al_${endToken}_(12_por_hoja).pdf`);
    } catch (err) {
      console.error('Error generando PDF de QRs:', err);
      alert('Ocurrió un error al generar el PDF de QRs.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
    }
  };

  // Descarga del SVG como PNG
  const downloadQrPng = (tokenId, bizName) => {
    const svgElement = document.getElementById(`qr-svg-${tokenId}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const context = canvas.getContext('2d');
      // Fondo blanco limpio
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, 600, 600);
      context.drawImage(image, 50, 50, 500, 500);

      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_NeXo_${bizName ? bizName.replace(/[^a-zA-Z0-9]/g, '_') : 'Token'}_${tokenId}.png`;
      downloadLink.href = png;
      downloadLink.click();
    };
    image.src = blobURL;
  };

  return (
    <div className="page-container db-view-wrapper">
      <style>{`
        .db-view-wrapper {
          max-width: 1240px;
          margin: 0 auto;
          padding-bottom: 50px;
        }

        /* GRID DE ESTADÍSTICAS */
        .db-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        /* VISTA ESCRITORIO (TABLA) VS VISTA MÓVIL (2 COLUMNAS DE CARDS) */
        .db-desktop-table-card {
          display: block;
        }
        .db-mobile-cards-grid {
          display: none;
        }

        /* CARD DE COMERCIO PARA CELULAR */
        .db-mobile-card {
          background: var(--color-surface);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s ease, border-color 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        [data-theme="light"] .db-mobile-card {
          background: #ffffff;
          border-color: rgba(15, 23, 42, 0.08);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        }

        .db-mobile-card:active {
          transform: scale(0.98);
        }

        /* SEARCH BAR Y FILTROS PERSONALIZADOS (SIN ESTILO GENÉRICO HTML) */
        .db-search-filter-wrapper {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          flex-wrap: wrap !important;
          gap: 12px !important;
          width: 100% !important;
          padding: 12px 18px !important;
          margin-bottom: 20px !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          position: relative !important;
          z-index: 100 !important;
        }

        .db-search-box {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 10px !important;
          flex: 1 1 300px !important;
          max-width: 520px !important;
          height: 42px !important;
          min-height: 42px !important;
          max-height: 42px !important;
          background: rgba(255, 255, 255, 0.04) !important;
          padding: 0 14px !important;
          border-radius: 12px !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
          box-sizing: border-box !important;
          transition: all 0.2s ease !important;
        }

        [data-theme="light"] .db-search-box {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        .db-search-box:focus-within {
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15) !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }

        [data-theme="light"] .db-search-box:focus-within {
          background: #ffffff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
        }

        .db-search-icon {
          color: var(--color-text-secondary);
          flex-shrink: 0;
          transition: color 0.2s ease;
        }

        .db-search-box:focus-within .db-search-icon {
          color: var(--color-accent);
        }

        [data-theme="light"] .db-search-box:focus-within .db-search-icon {
          color: #0284c7;
        }

        .db-search-input {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: var(--color-text-primary) !important;
          width: 100% !important;
          height: 100% !important;
          font-size: 0.88rem !important;
          font-family: inherit !important;
          padding: 0 !important;
          margin: 0 !important;
          line-height: normal !important;
        }

        .db-search-input::placeholder {
          color: var(--color-text-secondary);
          opacity: 0.7;
        }

        .db-search-clear-btn {
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .db-search-clear-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* CUSTOM DROPDOWN TRIGGER (ELIMINA SELECT NATIVO) */
        .db-city-dropdown-trigger {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          height: 42px !important;
          min-height: 42px !important;
          padding: 0 16px !important;
          border-radius: 12px !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          color: var(--color-text-primary) !important;
          cursor: pointer !important;
          font-size: 0.84rem !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
          outline: none !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }

        [data-theme="light"] .db-city-dropdown-trigger {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        .db-city-dropdown-trigger:hover,
        .db-city-dropdown-trigger.open {
          border-color: var(--color-accent) !important;
          background: rgba(6, 182, 212, 0.08) !important;
        }

        [data-theme="light"] .db-city-dropdown-trigger:hover,
        [data-theme="light"] .db-city-dropdown-trigger.open {
          border-color: #0284c7 !important;
          background: #f0f9ff !important;
        }

        .db-city-trigger-label {
          white-space: nowrap;
        }

        .db-city-chevron {
          color: var(--color-text-secondary);
          transition: transform 0.2s ease, color 0.2s ease;
          flex-shrink: 0;
        }

        .db-city-chevron.rotated {
          transform: rotate(180deg);
          color: var(--color-accent);
        }

        [data-theme="light"] .db-city-chevron.rotated {
          color: #0284c7;
        }

        /* FLOATING DROPDOWN MENU POPOVER */
        .db-city-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 230px;
          max-height: 280px;
          overflow-y: auto;
          background: var(--color-surface) !important;
          border: 1.5px solid rgba(148, 163, 184, 0.3) !important;
          border-radius: 14px;
          padding: 6px;
          z-index: 99999 !important;
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(16px);
          animation: dbFadeIn 0.15s ease-out;
        }

        [data-theme="light"] .db-city-dropdown-menu {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.18), 0 6px 16px rgba(15, 23, 42, 0.08) !important;
        }

        @keyframes dbFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .db-city-dropdown-header {
          padding: 6px 10px 4px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary);
          opacity: 0.8;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          margin-bottom: 4px;
        }

        .db-city-dropdown-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--color-text-primary);
          transition: all 0.15s ease;
          gap: 10px;
        }

        .db-city-dropdown-option:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        [data-theme="light"] .db-city-dropdown-option:hover {
          background: #f1f5f9;
        }

        .db-city-dropdown-option.selected {
          background: rgba(6, 182, 212, 0.12);
          color: var(--color-accent);
          font-weight: 600;
        }

        [data-theme="light"] .db-city-dropdown-option.selected {
          background: rgba(2, 132, 199, 0.1);
          color: #0284c7;
        }

        .db-city-option-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .db-city-option-name {
          white-space: nowrap;
        }

        .db-city-option-count {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 8px;
          background: rgba(148, 163, 184, 0.15);
          color: var(--color-text-secondary);
        }

        .db-city-dropdown-option.selected .db-city-option-count {
          background: rgba(6, 182, 212, 0.2);
          color: var(--color-accent);
        }

        [data-theme="light"] .db-city-dropdown-option.selected .db-city-option-count {
          background: rgba(2, 132, 199, 0.15);
          color: #0284c7;
        }

        .db-city-check-icon {
          color: var(--color-accent);
          flex-shrink: 0;
        }

        [data-theme="light"] .db-city-check-icon {
          color: #0284c7;
        }

        /* COUNTER BADGE */
        .db-counter-badge {
          font-size: 0.76rem !important;
          color: var(--color-accent) !important;
          font-weight: 700 !important;
          white-space: nowrap !important;
          background: rgba(6, 182, 212, 0.08) !important;
          border: 1px solid rgba(6, 182, 212, 0.2) !important;
          height: 42px !important;
          min-height: 42px !important;
          padding: 0 14px !important;
          border-radius: 12px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }

        [data-theme="light"] .db-counter-badge {
          background: rgba(2, 132, 199, 0.08) !important;
          border-color: rgba(2, 132, 199, 0.2) !important;
          color: #0284c7 !important;
        }

        /* AJUSTES RESPONSIVOS PARA PANTALLAS DE CELULAR */
        @media (max-width: 768px) {
          .db-stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .db-stat-item {
            padding: 10px 8px !important;
            flex-direction: column !important;
            text-align: center !important;
            gap: 6px !important;
            align-items: center !important;
            border-radius: 14px !important;
          }
          .db-stat-icon-wrapper {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
          }
          .db-stat-value {
            font-size: 1.25rem !important;
          }
          .db-stat-caption {
            font-size: 0.65rem !important;
            letter-spacing: 0 !important;
          }

          /* ESCONDER TABLA CON SCROLL HORIZONTAL */
          .db-desktop-table-card {
            display: none !important;
          }

          /* MOSTRAR CARDS EN 2 COLUMNAS EXACTAS */
          .db-mobile-cards-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            width: 100% !important;
          }

          .db-header-actions {
            width: 100%;
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 8px !important;
          }
          .db-header-actions button {
            width: 100% !important;
            padding: 9px 8px !important;
            font-size: 0.78rem !important;
            justify-content: center !important;
          }

          .db-search-box {
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            max-height: 42px !important;
          }
          .db-city-dropdown-menu {
            right: auto;
            left: 0;
            width: 100%;
            min-width: 200px;
          }
        }
      `}</style>

      {/* 1. ENCABEZADO DEL MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.28)', padding: '3px 10px', borderRadius: '16px', marginBottom: '8px' }}>
            <Database size={13} color="var(--color-accent)" />
            <span style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Directorio Satelital
            </span>
          </div>
          <h1 className="text-gradient" style={{ margin: '0 0 6px 0', fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Base de Datos de Clientes
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Catálogo maestro de comercios enlazados, contactos directos y tokens QR físicos.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="db-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setBatchModalOpen(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', fontSize: '0.86rem', fontWeight: '700' }}
            title="Herramienta para visualizar o preparar los 1000 QRs físicos impresos"
          >
            <QrCode size={16} color="var(--color-accent)" />
            <span>Lote 1,000 QRs</span>
          </button>

          <button
            onClick={exportToPDF}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', fontSize: '0.86rem', fontWeight: '700', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)' }}
          >
            <Download size={16} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE ESTADÍSTICAS RÁPIDAS (ADAPTADAS PARA MÓVIL Y ESCRITORIO) */}
      <div className="db-stats-grid">
        <div className="bento-card db-stat-item" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="db-stat-icon-wrapper" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="var(--color-accent)" />
          </div>
          <div>
            <span className="db-stat-caption" style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>Locales</span>
            <h3 className="db-stat-value" style={{ margin: '2px 0 0', fontSize: '1.45rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{businesses.length}</h3>
          </div>
        </div>

        <div className="bento-card db-stat-item" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="db-stat-icon-wrapper" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <QrCode size={20} color="#10b981" />
          </div>
          <div>
            <span className="db-stat-caption" style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>QRs Activos</span>
            <h3 className="db-stat-value" style={{ margin: '2px 0 0', fontSize: '1.45rem', fontWeight: '800', color: '#10b981' }}>{businesses.filter(b => b.qr_token).length}</h3>
          </div>
        </div>

        <div className="bento-card db-stat-item" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="db-stat-icon-wrapper" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={20} color="#f59e0b" />
          </div>
          <div>
            <span className="db-stat-caption" style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>Ciudades</span>
            <h3 className="db-stat-value" style={{ margin: '2px 0 0', fontSize: '1.45rem', fontWeight: '800', color: '#f59e0b' }}>{Math.max(1, cities.length - 1)}</h3>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE BÚSQUEDA Y FILTROS PROFESIONAL */}
      <div 
        className="bento-card db-search-filter-wrapper"
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px', 
          padding: '12px 18px', 
          marginBottom: '20px',
          overflow: 'visible',
          position: 'relative',
          zIndex: 100
        }}
      >
        {/* Input de Búsqueda Moderno */}
        <div className="db-search-box">
          <Search size={16} className="db-search-icon" />
          <input 
            type="text"
            className="clean-input db-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por comercio, dueño, ciudad, teléfono..."
          />
          {searchQuery && (
            <button 
              type="button"
              className="db-search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Borrar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro por Ciudad Personalizado (Dropdown Flotante) y Contador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', position: 'relative', zIndex: 101 }}>
          <div ref={cityDropdownRef} style={{ position: 'relative', zIndex: 102 }}>
            <button
              type="button"
              className={`db-city-dropdown-trigger ${isCityDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              title="Filtrar por ciudad"
            >
              <Filter size={14} color="var(--color-accent)" />
              <span className="db-city-trigger-label">
                {selectedCity === 'ALL' ? 'Todas las Ciudades' : selectedCity}
              </span>
              <ChevronDown 
                size={14} 
                className={`db-city-chevron ${isCityDropdownOpen ? 'rotated' : ''}`}
              />
            </button>

            {/* Menú Desplegable Personalizado Flotante */}
            {isCityDropdownOpen && (
              <div className="db-city-dropdown-menu">
                <div className="db-city-dropdown-header">Filtrar por Municipio</div>
                {cities.map(c => {
                  const isSelected = selectedCity === c;
                  const count = c === 'ALL' ? businesses.length : businesses.filter(b => b.city === c).length;
                  return (
                    <div
                      key={c}
                      onClick={() => {
                        setSelectedCity(c);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`db-city-dropdown-option ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="db-city-option-content">
                        <span className="db-city-option-name">
                          {c === 'ALL' ? 'Todas las Ciudades' : c}
                        </span>
                        <span className="db-city-option-count">{count}</span>
                      </div>
                      {isSelected && <Check size={14} className="db-city-check-icon" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <span className="db-counter-badge">
            {filteredData.length} de {businesses.length}
          </span>
        </div>
      </div>

      {/* 4. A. VISTA ESCRITORIO: TABLA PREMIUM CON SCROLL INTERNO PROPIO */}
      <div className="bento-card db-desktop-table-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div 
          className="custom-scrollbar db-table-scroll-container" 
          style={{ 
            overflowX: 'auto', 
            overflowY: 'auto', 
            maxHeight: '580px', 
            position: 'relative' 
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 15 }}>
              <tr className="db-table-header-row" style={{ background: 'var(--color-surface, #0f172a)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: 'var(--color-text-secondary)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '14px 18px', background: 'inherit' }}>Establecimiento</th>
                <th style={{ padding: '14px 16px', background: 'inherit' }}>Dueño / Titular</th>
                <th style={{ padding: '14px 16px', background: 'inherit' }}>Teléfono</th>
                <th style={{ padding: '14px 16px', background: 'inherit' }}>Ciudad</th>
                <th style={{ padding: '14px 16px', background: 'inherit' }}>Dirección</th>
                <th style={{ padding: '14px 16px', background: 'inherit' }}>Token QR</th>
                <th style={{ padding: '14px 18px', textAlign: 'center', background: 'inherit' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>No se encontraron registros</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Intenta ajustar la búsqueda o el filtro de ciudad.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(business => {
                  const isCopied = copiedToken === business.qr_token;
                  const cleanPhone = business.phone ? business.phone.replace(/[^0-9]/g, '') : '';
                  const waText = encodeURIComponent(`Hola *${business.business_name}* 👋 Te contactamos desde la central operativa de *NeXo Radar* (Terminal #[${business.qr_token || '---'}]). ¿En qué podemos colaborarte hoy? 🛡️`);
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${waText}` : null;

                  return (
                    <tr 
                      key={business.id}
                      style={{ 
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.04)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Establecimiento con Avatar */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {business.logo_url ? (
                            <img 
                              src={`http://127.0.0.1:5000${business.logo_url}`} 
                              alt="" 
                              style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', background: '#111923', border: '1.5px solid rgba(6, 182, 212, 0.25)' }} 
                            />
                          ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Building2 size={18} color="var(--color-accent)" />
                            </div>
                          )}
                          <div>
                            <span style={{ fontWeight: '750', color: 'var(--color-text-primary)', display: 'block', fontSize: '0.92rem' }}>
                              {business.business_name}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                              ID: {business.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Dueño */}
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="var(--color-text-secondary)" />
                          <span style={{ fontWeight: '500' }}>{business.owner_name || '---'}</span>
                        </div>
                      </td>

                      {/* Teléfono con Enlace a WhatsApp */}
                      <td style={{ padding: '14px 16px' }}>
                        {business.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a 
                              href={`tel:${business.phone}`} 
                              style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '500' }}
                            >
                              {business.phone}
                            </a>
                            {waUrl && (
                              <a 
                                href={waUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="Abrir chat de WhatsApp"
                                style={{ color: '#25D366', display: 'inline-flex', padding: '2px 4px', textDecoration: 'none', fontWeight: '700', fontSize: '0.74rem' }}
                              >
                                WA
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)' }}>---</span>
                        )}
                      </td>

                      {/* Ciudad */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-primary)' }}>
                          <MapPin size={13} color="var(--color-accent)" />
                          <span>{business.city || '---'}</span>
                        </div>
                      </td>

                      {/* Dirección */}
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', maxWidth: '220px', wordBreak: 'break-word', fontSize: '0.82rem' }}>
                        {business.address || '---'}
                      </td>

                      {/* Token QR */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.84rem', fontWeight: '800', color: 'var(--color-accent)', background: 'rgba(6,182,212,0.12)', padding: '3px 9px', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.3)' }}>
                          #{business.qr_token}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openQrModal(business)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}
                            title="Ver e Imprimir Código QR"
                          >
                            <QrCode size={13} color="var(--color-accent)" />
                            <span>Ver QR</span>
                          </button>

                          <button
                            onClick={(e) => copyQrUrl(business.qr_token, e)}
                            style={{ background: 'transparent', border: 'none', color: isCopied ? '#10b981' : 'var(--color-text-secondary)', cursor: 'pointer', padding: '6px' }}
                            title="Copiar URL directa al portapapeles"
                          >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>

                          <a
                            href={`/qr/${business.qr_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-text-secondary)', padding: '6px', display: 'inline-flex' }}
                            title="Visitar Portal de Cliente"
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. B. VISTA MÓVIL: CARDS EN 2 COLUMNAS (CERO SCROLL HORIZONTAL) */}
      <div className="db-mobile-cards-grid">
        {filteredData.length === 0 ? (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px 16px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px', color: 'var(--color-text-secondary)', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>Sin resultados</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          filteredData.map(business => {
            const isCopied = copiedToken === business.qr_token;
            const cleanPhone = business.phone ? business.phone.replace(/[^0-9]/g, '') : '';
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}` : null;

            return (
              <div key={business.id} className="db-mobile-card">
                {/* Cabecera de la Tarjeta */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                    {business.logo_url ? (
                      <img 
                        src={`http://127.0.0.1:5000${business.logo_url}`} 
                        alt="" 
                        style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid rgba(6, 182, 212, 0.3)' }} 
                      />
                    ) : (
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={16} color="var(--color-accent)" />
                      </div>
                    )}
                    
                    <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: '800', color: 'var(--color-accent)', background: 'rgba(6, 182, 212, 0.12)', padding: '2px 7px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.28)' }}>
                      #{business.qr_token}
                    </span>
                  </div>

                  {/* Nombre y Ciudad */}
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.86rem', fontWeight: '800', color: 'var(--color-text-primary)', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {business.business_name}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    <MapPin size={11} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {business.city || 'Sin ciudad'}
                    </span>
                  </div>

                  {business.owner_name && (
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.7rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {business.owner_name}
                    </p>
                  )}
                </div>

                {/* Acciones de la Tarjeta Móvil */}
                <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <button
                    onClick={() => openQrModal(business)}
                    style={{
                      flex: '1',
                      padding: '6px 8px',
                      borderRadius: '7px',
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--color-accent)',
                      fontSize: '0.72rem',
                      fontWeight: '750',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <QrCode size={12} />
                    <span>Ver QR</span>
                  </button>

                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px',
                        borderRadius: '7px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                      title="WhatsApp"
                    >
                      <Phone size={12} />
                    </a>
                  )}

                  <button
                    onClick={(e) => copyQrUrl(business.qr_token, e)}
                    style={{
                      padding: '6px',
                      borderRadius: '7px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: isCopied ? '#10b981' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copiar URL"
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: VISUALIZACIÓN / IMPRESIÓN DEL QR INDIVIDUAL */}
      {selectedBusiness && (
        <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Código QR de la Terminal">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {/* Contenedor Imprimible */}
            <div 
              id="printable-qr-card"
              style={{ 
                background: '#FFFFFF', 
                borderRadius: '16px', 
                padding: '24px 20px', 
                border: '1px solid #E4E7EC', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                display: 'inline-block',
                margin: '0 auto 20px'
              }}
            >
              {/* Logotipo NeXo Radar de entrada */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <img 
                  src="/logo-nexo-radar.png" 
                  alt="NeXo Radar" 
                  style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  TERMINAL ASIGNADA
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', color: '#0F172A', fontWeight: '800' }}>
                  {selectedBusiness.business_name}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                  {selectedBusiness.city} &middot; Nodo #{selectedBusiness.qr_token}
                </p>
              </div>

              {/* QR Renderizado */}
              <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
                <QRCodeSVG
                  id={`qr-svg-${selectedBusiness.qr_token}`}
                  value={`${window.location.origin}/qr/${selectedBusiness.qr_token}`}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div style={{ marginTop: '14px', borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: '700' }}>
                  NeXo Radar &middot; Escanea para Asistencia
                </span>
              </div>
            </div>

            {/* Enlace Directo */}
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '20px', wordBreak: 'break-all' }}>
              <code>{`${window.location.origin}/qr/${selectedBusiness.qr_token}`}</code>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => downloadQrPng(selectedBusiness.qr_token, selectedBusiness.business_name)}
                className="btn-primary"
                style={{ padding: '11px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '0.86rem' }}
              >
                <Download size={16} />
                <span>Descargar Imagen PNG</span>
              </button>

              <button
                onClick={() => copyQrUrl(selectedBusiness.qr_token)}
                className="btn-secondary"
                style={{ padding: '11px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '0.86rem' }}
              >
                {copiedToken === selectedBusiness.qr_token ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedToken === selectedBusiness.qr_token ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: GESTOR Y PREPARADOR DEL LOTE DE 1,000 QRs FÍSICOS */}
      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Lote de 1,000 Códigos QR Físicos">
        <div style={{ padding: '10px 0' }}>
          
          {/* Alerta de Seguridad de Impresión */}
          <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1.5px solid rgba(2, 132, 199, 0.3)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldCheck size={20} color="var(--color-accent)" />
              <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--color-accent)', fontWeight: '800' }}>
                Protección de Inversión: Regla de Oro (Sin Ctrl+Z)
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Para imprimir tus <strong>1,000 tarjetas/stickers físicos</strong> con total seguridad, asegúrate de configurar el dominio público definitivo de tu sistema. Una vez impresos, cada QR apuntará para siempre a su token (ej: <code>/qr/0001</code> hasta <code>/qr/1000</code>). Podrás visitar cualquier comercio en tu ciudad o municipios aledaños y vincularlo en segundos sin volver a imprimir nada.
            </p>
          </div>

          {/* Configuración de Dominio y Rango de Lote */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                Dominio Base del Sistema *
              </label>
              <input 
                type="text" 
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="https://tudominio.com"
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                URL codificada en los QRs físicos
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                Desde el Token #
              </label>
              <input 
                type="number" 
                min="1" 
                max="1000"
                value={batchStart}
                onChange={(e) => setBatchStart(Math.max(1, parseInt(e.target.value) || 1))}
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                Cantidad de QRs a Generar
              </label>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value))}
                style={{ width: '100%', background: 'var(--color-bg)', color: 'var(--color-text-primary)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.88rem' }}
              >
                <option value={12}>12 QRs (1 hoja A4)</option>
                <option value={24}>24 QRs (2 hojas A4)</option>
                <option value={48}>48 QRs (4 hojas A4)</option>
                <option value={96}>96 QRs (8 hojas A4)</option>
                <option value={120}>120 QRs (10 hojas A4)</option>
                <option value={240}>240 QRs (20 hojas A4)</option>
                <option value={480}>480 QRs (40 hojas A4)</option>
                <option value={600}>600 QRs (50 hojas A4)</option>
                <option value={1000}>1,000 QRs (84 hojas A4 - Lote Completo)</option>
              </select>
            </div>
          </div>

          {/* Malla de Tarjetas QR para Imprimir o Revisar */}
          <div 
            id="printable-batch-area"
            className="custom-scrollbar"
            style={{ maxHeight: '420px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', padding: '6px' }}
          >
            {Array.from({ length: batchCount }).map((_, idx) => {
              const tokenNumber = batchStart + idx;
              const formattedToken = String(tokenNumber).padStart(3, '0'); // ej 001, 002, 1000
              const isRegistered = businesses.some(b => b.qr_token === formattedToken || b.qr_token === String(tokenNumber));
              const businessLinked = businesses.find(b => b.qr_token === formattedToken || b.qr_token === String(tokenNumber));
              const finalQrUrl = `${customDomain.replace(/\/$/, '')}/qr/${formattedToken}`;

              return (
                <div 
                  key={formattedToken}
                  style={{
                    background: '#FFFFFF',
                    border: isRegistered ? '2px solid #10b981' : '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Código del Token arriba a la izquierda (SIN DISPONIBLE) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                        #{formattedToken}
                      </span>
                    </div>

                    <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'inline-block', marginBottom: '8px' }}>
                      <QRCodeSVG
                        value={finalQrUrl}
                        size={110}
                        level="H"
                        includeMargin={false}
                        style={{ display: 'block' }}
                      />
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '0.76rem', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {businessLinked ? businessLinked.business_name : 'NeXo Radar Física'}
                    </p>
                  </div>

                  {isRegistered ? (
                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <CheckCircle2 size={12} />
                      Enlazado
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setBatchModalOpen(false);
                        navigate(`/register?qr=${encodeURIComponent(formattedToken)}`);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: '#0284c7',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Vincular Local</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones Inferiores de Acción */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Tokens #{String(batchStart).padStart(3, '0')} al #{String(batchStart + batchCount - 1).padStart(3, '0')} · <strong style={{ color: 'var(--color-accent)' }}>{Math.ceil(batchCount / 12)} hoja(s) A4 (12 QRs por hoja)</strong>
            </span>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary" 
                onClick={exportBatchQrPdf}
                disabled={isGeneratingPdf}
                style={{ 
                  padding: '10px 22px', 
                  borderRadius: '10px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: isGeneratingPdf ? 'not-allowed' : 'pointer'
                }}
              >
                {isGeneratingPdf ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{isGeneratingPdf ? `Generando PDF (${pdfProgress}%)...` : 'Exportar QR'}</span>
              </button>

              <button className="btn-secondary" onClick={() => setBatchModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '600' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
