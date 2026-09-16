import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserPlus, Shield, ShieldCheck, KeyRound, 
  Trash2, Edit3, Search, Check, Copy, AlertCircle, 
  Loader2, RefreshCw, Lock, Mail, User, Eye, EyeOff,
  Sparkles, X, CheckCircle2, ChevronRight, Hash, Calendar
} from 'lucide-react';
import Modal from '../components/Modal';
import { API_BASE } from '../config';

export default function SuperAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados de formularios y selección
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'colaborador'
  });
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Estados de feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [copiedId, setCopiedId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/users?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando colaboradores:', err);
      setUsers([]);
      setStatusMessage({
        type: 'error',
        text: 'No se pudo cargar la lista de colaboradores desde el servidor.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const handleWakeUp = () => {
      if (document.visibilityState === 'visible' || !document.hidden) {
        fetchUsers();
      }
    };

    document.addEventListener('visibilitychange', handleWakeUp);
    window.addEventListener('pageshow', handleWakeUp);
    window.addEventListener('focus', handleWakeUp);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeUp);
      window.removeEventListener('pageshow', handleWakeUp);
      window.removeEventListener('focus', handleWakeUp);
    };
  }, []);

  const showNotification = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Crear Colaborador
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/users`, formData);
      setUsers(prev => [res.data, ...prev]);
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'colaborador' });
      showNotification(`Colaborador ${res.data.name} añadido con éxito.`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al registrar colaborador';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir Modal de Edición
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'colaborador'
    });
    setIsEditModalOpen(true);
  };

  // Guardar Edición
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const res = await axios.put(`${API_BASE}/api/users/${selectedUser.id}`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? res.data : u));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      showNotification(`Datos de ${res.data.name} actualizados exitosamente.`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al actualizar colaborador';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir Modal de Cambio de Contraseña
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowNewPassword(false);
    setIsPasswordModalOpen(true);
  };

  // Guardar Nueva Contraseña
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE}/api/users/${selectedUser.id}/password`, {
        newPassword
      });
      setIsPasswordModalOpen(false);
      showNotification(`Contraseña restablecida exitosamente para ${selectedUser.name}.`);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al cambiar la contraseña';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir Modal de Eliminación
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirmar Eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/users/${selectedUser.id}`);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      showNotification(`Colaborador ${selectedUser.name} eliminado del sistema.`);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al eliminar colaborador';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado de colaboradores
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    );
  });

  const totalColaboradores = users.filter(u => (u.role || '').toLowerCase() === 'colaborador').length;
  const totalAdmins = users.filter(u => ['admin', 'superadmin'].includes((u.role || '').toLowerCase())).length;

  return (
    <div className="superadmin-wrapper page-container">
      
      {/* Toast Flotante de Feedback */}
      {statusMessage && (
        <div className={`superadmin-toast ${statusMessage.type}`}>
          {statusMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusMessage.text}</span>
          <button className="toast-close" onClick={() => setStatusMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. HEADER HERO DEL MÓDULO */}
      <div className="superadmin-hero-header">
        <div className="superadmin-title-group">
          <div className="superadmin-badge">
            <ShieldCheck size={16} className="badge-icon" />
            <span>MÓDULO SUPER ADMINISTRADOR</span>
          </div>

          <h1 className="superadmin-h1">
            Gestión de <span className="superadmin-gradient-text">Colaboradores</span>
          </h1>

          <p className="superadmin-subtitle">
            Asigna permisos de acceso operativo para tu equipo, gestiona roles y audita contraseñas de supervisión en tiempo real.
          </p>
        </div>

        {/* Botones de Acción del Header */}
        <div className="superadmin-header-actions">
          <button
            className="superadmin-btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
            title="Recargar lista de colaboradores"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            className="superadmin-btn-primary"
            onClick={() => {
              setFormData({ name: '', email: '', password: '', role: 'colaborador' });
              setIsAddModalOpen(true);
            }}
          >
            <UserPlus size={16} />
            <span>Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS BENTO (SISTEMA DE DISEÑO NEXO) */}
      <div className="superadmin-stats-grid">
        
        {/* Card 1: Colaboradores Operativos */}
        <div className="superadmin-stat-card card-colab">
          <div className="stat-card-header">
            <span className="stat-label">Colaboradores Operativos</span>
            <div className="stat-icon-box cyan">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{totalColaboradores}</div>
          <div className="stat-footer-pill cyan">
            <span className="pill-dot"></span>
            <span>Acceso limitado (Dashboard, Terminales, Mapa, Alertas, Registro)</span>
          </div>
        </div>

        {/* Card 2: Administradores */}
        <div className="superadmin-stat-card card-admin">
          <div className="stat-card-header">
            <span className="stat-label">Administradores</span>
            <div className="stat-icon-box amber">
              <Shield size={18} />
            </div>
          </div>
          <div className="stat-value">{totalAdmins}</div>
          <div className="stat-footer-pill amber">
            <span className="pill-dot"></span>
            <span>Acceso total + Base de Datos + Super Admin</span>
          </div>
        </div>

        {/* Card 3: Total Cuentas */}
        <div className="superadmin-stat-card card-total">
          <div className="stat-card-header">
            <span className="stat-label">Total Cuentas Activas</span>
            <div className="stat-icon-box blue">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-footer-pill blue">
            <span className="pill-dot"></span>
            <span>Cuentas sincronizadas con la red NeXo</span>
          </div>
        </div>

      </div>

      {/* 3. BANNER DE POLÍTICA DE PERMISOS */}
      <div className="superadmin-policy-banner">
        <div className="policy-icon-wrapper">
          <AlertCircle size={20} />
        </div>
        <div className="policy-text">
          <strong>Política de Permisos para Colaboradores:</strong> Los usuarios con rol{' '}
          <span className="policy-highlight">Colaborador</span> tienen habilitado el acceso a{' '}
          <strong>Dashboard, Terminales, Mapa, Alertas</strong> y el <strong>Registro de Nodos</strong>. El módulo de{' '}
          <em>Base de Datos</em> y este panel de <em>Super Admin</em> están estrictamente protegidos para Administradores.
        </div>
      </div>

      {/* 4. BARRA DE HERRAMIENTAS: BÚSQUEDA Y CONTADOR */}
      <div className="superadmin-toolbar">
        <div className="superadmin-search-wrapper">
          <Search size={16} className="search-input-icon" />
          <input 
            type="text"
            placeholder="Buscar por nombre, usuario, correo o rol..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="superadmin-search-input"
          />
          {searchQuery && (
            <button 
              className="search-clear-btn" 
              onClick={() => setSearchQuery('')}
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="superadmin-count-tag">
          <span>Mostrando:</span>
          <strong>{filteredUsers.length}</strong>
          <span>de {users.length} usuarios</span>
        </div>
      </div>

      {/* 5. TABLA PRINCIPAL DE COLABORADORES */}
      <div className="superadmin-table-card">
        {loading ? (
          <div className="superadmin-state-box">
            <Loader2 className="animate-spin state-spinner" size={36} />
            <p>Cargando colaboradores del sistema...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="superadmin-state-box">
            <Users size={40} className="state-empty-icon" />
            <h3>No se encontraron colaboradores</h3>
            <p>
              {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Agrega el primer colaborador pulsando en "Nuevo Colaborador".'}
            </p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="superadmin-table">
              <thead>
                <tr>
                  <th>COLABORADOR / USUARIO</th>
                  <th>IDENTIFICADOR / CORREO</th>
                  <th>ROL EN NEXO</th>
                  <th>FECHA ALTA</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const roleLower = (user.role || '').toLowerCase();
                  const isAdmin = ['admin', 'superadmin'].includes(roleLower);
                  const isCopied = copiedId === user.id;

                  return (
                    <tr key={user.id || idx} className="table-data-row">
                      
                      {/* Colaborador / Nombre + Avatar + ID */}
                      <td className="user-name-cell">
                        <div className="user-avatar-row">
                          <div className={`user-avatar ${isAdmin ? 'admin' : 'colaborador'}`}>
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details-col">
                            <span className="user-full-name">{user.name}</span>
                            <div className="user-meta-badges-row">
                              <span className={`role-badge mobile-role-badge ${isAdmin ? 'admin' : 'colaborador'}`}>
                                {isAdmin ? <Shield size={11} /> : <Users size={11} />}
                                <span>{isAdmin ? 'Administrador' : 'Colaborador'}</span>
                              </span>
                              <button
                                type="button"
                                className="user-id-chip"
                                onClick={() => copyToClipboard(user.id, user.id)}
                                title="Click para copiar UUID completo"
                              >
                                <Hash size={11} className="hash-icon" />
                                <span>{(user.id || '').substring(0, 8)}...</span>
                                {isCopied ? <Check size={11} color="#10b981" /> : <Copy size={11} className="copy-icon" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Identificador / Correo */}
                      <td className="user-email-cell">
                        <div className="email-row">
                          <Mail size={14} className="email-icon" />
                          <span className="email-text">{user.email}</span>
                        </div>
                      </td>

                      {/* Rol en NeXo */}
                      <td className="user-role-cell desktop-role-cell">
                        <span className={`role-badge ${isAdmin ? 'admin' : 'colaborador'}`}>
                          {isAdmin ? <Shield size={12} /> : <Users size={12} />}
                          <span>{isAdmin ? 'Administrador' : 'Colaborador'}</span>
                        </span>
                      </td>

                      {/* Fecha de Creación */}
                      <td className="user-date-cell">
                        <div className="date-row">
                          <Calendar size={13} className="date-icon" />
                          <span>
                            {user.created_at 
                              ? new Date(user.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'Reciente'
                            }
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="user-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
                          
                          {/* Botón Cambiar Contraseña */}
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="action-btn-styled key-btn"
                            title="Cambiar contraseña de este usuario"
                          >
                            <KeyRound size={14} />
                            <span className="btn-label-text">Clave</span>
                          </button>

                          {/* Botón Editar */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="action-btn-styled edit-btn"
                            title="Editar datos del colaborador"
                          >
                            <Edit3 size={14} />
                            <span className="btn-label-text">Editar</span>
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="action-btn-styled delete-btn"
                            title="Eliminar colaborador del sistema"
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODALES DE ADMINISTRACIÓN CON SOPORTE DARK/LIGHT
          ======================================================== */}

      {/* MODAL: AGREGAR NUEVO COLABORADOR */}
      <Modal isOpen={isAddModalOpen} onClose={() => !actionLoading && setIsAddModalOpen(false)}>
        <div className="admin-modal-content">
          <div className="admin-modal-header">
            <div className="modal-icon-badge cyan">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="modal-title">Agregar Nuevo Colaborador</h3>
              <p className="modal-desc">Crea una cuenta para dar acceso al personal operativo en NeXo Radar.</p>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} className="admin-modal-form">
            <div className="admin-form-group">
              <label className="admin-form-label">Nombre Completo *</label>
              <div className="input-with-icon-wrapper">
                <User size={16} className="field-icon" />
                <input 
                  type="text"
                  placeholder="ej: Carlos Mendoza"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Usuario o Correo de Acceso *</label>
              <div className="input-with-icon-wrapper">
                <Mail size={16} className="field-icon" />
                <input 
                  type="text"
                  placeholder="ej: carlos@nexoradar.com o carlos123"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Nivel de Permisos / Rol *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="admin-form-select"
              >
                <option value="colaborador">Colaborador (Dashboard, Terminales, Mapa, Alertas, Registro)</option>
                <option value="admin">Administrador (Acceso total al sistema + Base de Datos + Super Admin)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Contraseña Temporal *</label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="field-icon" />
                <input 
                  type="text"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="modal-actions-bar">
              <button 
                type="button" 
                className="superadmin-btn-secondary" 
                onClick={() => setIsAddModalOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="superadmin-btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                <span>Crear Cuenta</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL: EDITAR COLABORADOR */}
      <Modal isOpen={isEditModalOpen} onClose={() => !actionLoading && setIsEditModalOpen(false)}>
        <div className="admin-modal-content">
          <div className="admin-modal-header">
            <div className="modal-icon-badge blue">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="modal-title">Editar Colaborador</h3>
              <p className="modal-desc">Modifica los datos personales o el nivel de privilegios asignados.</p>
            </div>
          </div>

          <form onSubmit={handleEditSubmit} className="admin-modal-form">
            <div className="admin-form-group">
              <label className="admin-form-label">Nombre Completo *</label>
              <div className="input-with-icon-wrapper">
                <User size={16} className="field-icon" />
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Usuario o Correo de Acceso *</label>
              <div className="input-with-icon-wrapper">
                <Mail size={16} className="field-icon" />
                <input 
                  type="text"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Nivel de Permisos / Rol *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="admin-form-select"
              >
                <option value="colaborador">Colaborador (Dashboard, Terminales, Mapa, Alertas, Registro)</option>
                <option value="admin">Administrador (Acceso total al sistema + Base de Datos + Super Admin)</option>
              </select>
            </div>

            <div className="modal-actions-bar">
              <button 
                type="button" 
                className="superadmin-btn-secondary" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="superadmin-btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL: CAMBIAR CONTRASEÑA */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => !actionLoading && setIsPasswordModalOpen(false)}>
        <div className="admin-modal-content">
          <div className="admin-modal-header">
            <div className="modal-icon-badge amber">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="modal-title">Cambiar Contraseña</h3>
              <p className="modal-desc">
                Restableciendo credenciales de: <strong className="user-modal-highlight">{selectedUser?.name}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="admin-modal-form">
            <div className="admin-form-group">
              <label className="admin-form-label">Nueva Contraseña de Acceso *</label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="field-icon" />
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres seguros"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="admin-form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="password-toggle-btn"
                  title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="modal-actions-bar">
              <button 
                type="button" 
                className="superadmin-btn-secondary" 
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="superadmin-btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Actualizar Clave</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => !actionLoading && setIsDeleteModalOpen(false)}>
        <div className="admin-modal-content delete-center">
          <div className="delete-warning-icon">
            <Trash2 size={26} />
          </div>

          <h3 className="modal-title">¿Eliminar Colaborador?</h3>

          <p className="modal-desc delete-desc">
            ¿Estás seguro de revocar el acceso a <strong className="user-modal-highlight">{selectedUser?.name}</strong>? 
            Esta persona perderá inmediatamente sus permisos para ingresar a la plataforma NeXo Radar.
          </p>

          <div className="modal-actions-bar delete-actions">
            <button 
              type="button" 
              className="superadmin-btn-secondary" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="superadmin-btn-danger"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>Confirmar Eliminación</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          ESTILOS CSS INTEGRALES (SISTEMA DE DISEÑO DARK & LIGHT)
          ======================================================== */}
      <style>{`
        /* Wrapper y Layout */
        .superadmin-wrapper {
          max-width: 1240px;
          margin: 0 auto;
          padding-bottom: 60px;
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        /* Toast Flotante */
        .superadmin-toast {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 9999;
          padding: 12px 18px;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 0.88rem;
          backdrop-filter: blur(12px);
          animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .superadmin-toast.success {
          background: rgba(6, 182, 212, 0.95);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .superadmin-toast.error {
          background: rgba(239, 68, 68, 0.95);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .toast-close {
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 2px;
          margin-left: 6px;
          opacity: 0.8;
          transition: opacity 0.15s;
        }
        .toast-close:hover {
          opacity: 1;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero Header */
        .superadmin-hero-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .superadmin-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: var(--color-accent, #06b6d4);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .superadmin-h1 {
          margin: 0 0 8px 0;
          font-size: 2.3rem;
          font-weight: 800;
          color: var(--color-text-primary, #f8fafc);
          letter-spacing: -0.025em;
          line-height: 1.15;
        }
        .superadmin-gradient-text {
          background: linear-gradient(135deg, #06b6d4 0%, #38bdf8 50%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .superadmin-subtitle {
          margin: 0;
          color: var(--color-text-secondary, #94a3b8);
          font-size: 0.95rem;
          max-width: 680px;
          line-height: 1.5;
        }

        /* Botones del Header */
        .superadmin-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .superadmin-btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 11px 20px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(6, 182, 212, 0.25);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .superadmin-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
        }
        .superadmin-btn-primary:active {
          transform: translateY(0);
        }
        .superadmin-btn-secondary {
          background: var(--color-surface, #0f172a);
          color: var(--color-text-primary, #f8fafc);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          padding: 11px 18px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .superadmin-btn-secondary:hover {
          background: var(--color-surface-hover, #1e293b);
          border-color: rgba(148, 163, 184, 0.35);
        }
        .superadmin-btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
          transition: all 0.2s ease;
        }
        .superadmin-btn-danger:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
        }

        /* Tarjetas de Métricas Bento */
        .superadmin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .superadmin-stat-card {
          background: var(--color-surface, #0f172a);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .superadmin-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(148, 163, 184, 0.25);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .stat-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-text-secondary, #94a3b8);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon-box.cyan {
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: var(--color-accent, #06b6d4);
        }
        .stat-icon-box.amber {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #f59e0b;
        }
        .stat-icon-box.blue {
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: #3b82f6;
        }
        .stat-value {
          font-size: 2.3rem;
          font-weight: 900;
          color: var(--color-text-primary, #f8fafc);
          line-height: 1;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
        }
        .stat-footer-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 600;
          line-height: 1.35;
          padding: 5px 10px;
          border-radius: 8px;
        }
        .stat-footer-pill.cyan {
          background: rgba(6, 182, 212, 0.08);
          color: #06b6d4;
          border: 1px solid rgba(6, 182, 212, 0.2);
        }
        .stat-footer-pill.amber {
          background: rgba(245, 158, 11, 0.08);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .stat-footer-pill.blue {
          background: rgba(59, 130, 246, 0.08);
          color: #38bdf8;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* Banner de Política */
        .superadmin-policy-banner {
          background: rgba(6, 182, 212, 0.06);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .policy-icon-wrapper {
          color: var(--color-accent, #06b6d4);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .policy-text {
          font-size: 0.88rem;
          color: var(--color-text-secondary, #94a3b8);
          line-height: 1.5;
        }
        .policy-text strong {
          color: var(--color-text-primary, #f8fafc);
        }
        .policy-highlight {
          color: var(--color-accent, #06b6d4);
          font-weight: 700;
        }

        /* Toolbar: Búsqueda y Contador */
        .superadmin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .superadmin-search-wrapper {
          position: relative;
          flex: 1 1 320px;
          max-width: 460px;
        }
        .search-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-secondary, #94a3b8);
          pointer-events: none;
        }
        .superadmin-search-input {
          width: 100%;
          padding: 11px 36px 11px 40px;
          background: var(--color-surface, #0f172a);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          color: var(--color-text-primary, #f8fafc);
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .superadmin-search-input:focus {
          border-color: var(--color-accent, #06b6d4);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
        }
        .search-clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-text-secondary, #94a3b8);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }
        .superadmin-count-tag {
          font-size: 0.84rem;
          color: var(--color-text-secondary, #94a3b8);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .superadmin-count-tag strong {
          color: var(--color-text-primary, #f8fafc);
          font-weight: 700;
        }

        /* Tabla Principal */
        .superadmin-table-card {
          background: var(--color-surface, #0f172a);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 6px 20px -2px rgba(0, 0, 0, 0.15);
        }
        .table-responsive-container {
          width: 100%;
          overflow-x: auto;
        }
        .superadmin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .superadmin-table thead tr {
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .superadmin-table th {
          padding: 16px 20px;
          color: var(--color-text-secondary, #94a3b8);
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .table-data-row {
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          transition: background-color 0.15s ease;
        }
        .table-data-row:last-child {
          border-bottom: none;
        }
        .table-data-row:hover {
          background-color: rgba(255, 255, 255, 0.025);
        }
        .superadmin-table td {
          padding: 16px 20px;
          vertical-align: middle;
        }

        /* Celda de Usuario / Avatar / ID */
        .user-avatar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .user-avatar.admin {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #f59e0b;
        }
        .user-avatar.colaborador {
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid rgba(6, 182, 212, 0.35);
          color: var(--color-accent, #06b6d4);
        }
        .user-details-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-full-name {
          font-weight: 700;
          color: var(--color-text-primary, #f8fafc);
          font-size: 0.92rem;
        }
        .user-id-chip {
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 0.72rem;
          color: var(--color-text-secondary, #94a3b8);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s;
          width: fit-content;
        }
        .user-id-chip:hover {
          background: rgba(6, 182, 212, 0.15);
          border-color: rgba(6, 182, 212, 0.3);
          color: var(--color-accent, #06b6d4);
        }

        /* Celda de Correo */
        .email-row {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--color-text-secondary, #94a3b8);
        }
        .email-icon {
          opacity: 0.7;
          flex-shrink: 0;
        }
        .email-text {
          font-size: 0.88rem;
          font-weight: 500;
        }

        /* Badges de Rol */
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .role-badge.admin {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .role-badge.colaborador {
          background: rgba(6, 182, 212, 0.12);
          color: var(--color-accent, #06b6d4);
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        .mobile-role-badge {
          display: none;
        }
        .user-meta-badges-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Celda de Fecha */
        .date-row {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-secondary, #94a3b8);
          font-size: 0.84rem;
        }
        .date-icon {
          opacity: 0.6;
        }

        /* Grupo de Botones de Acción */
        .action-buttons-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .action-btn-styled {
          padding: 7px 11px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid transparent;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          background: transparent;
        }
        .action-btn-styled.key-btn {
          background: rgba(6, 182, 212, 0.08);
          color: var(--color-accent, #06b6d4);
          border-color: rgba(6, 182, 212, 0.22);
        }
        .action-btn-styled.key-btn:hover {
          background: rgba(6, 182, 212, 0.18);
          border-color: rgba(6, 182, 212, 0.4);
          transform: translateY(-1px);
        }
        .action-btn-styled.edit-btn {
          background: rgba(148, 163, 184, 0.08);
          color: var(--color-text-primary, #f8fafc);
          border-color: rgba(148, 163, 184, 0.2);
        }
        .action-btn-styled.edit-btn:hover {
          background: rgba(148, 163, 184, 0.18);
          border-color: rgba(148, 163, 184, 0.35);
          transform: translateY(-1px);
        }
        .action-btn-styled.delete-btn {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.22);
          padding: 7px 9px;
        }
        .action-btn-styled.delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.45);
          transform: translateY(-1px);
        }

        /* Estados de Carga y Vacío */
        .superadmin-state-box {
          padding: 60px 20px;
          text-align: center;
        }
        .state-spinner {
          color: var(--color-accent, #06b6d4);
          margin: 0 auto 12px;
        }
        .state-empty-icon {
          color: var(--color-text-secondary, #94a3b8);
          opacity: 0.35;
          margin: 0 auto 12px;
        }
        .superadmin-state-box h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text-primary, #f8fafc);
          margin: 0 0 6px 0;
        }
        .superadmin-state-box p {
          color: var(--color-text-secondary, #94a3b8);
          font-size: 0.88rem;
          margin: 0;
        }

        /* ========================================================
           ESTILOS DE LOS MODALES DE ADMINISTRACIÓN
           ======================================================== */
        .admin-modal-content {
          padding: 8px 4px;
        }
        .admin-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .modal-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .modal-icon-badge.cyan {
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--color-accent, #06b6d4);
        }
        .modal-icon-badge.blue {
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }
        .modal-icon-badge.amber {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }
        .modal-title {
          margin: 0 0 2px 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary, #f8fafc);
        }
        .modal-desc {
          margin: 0;
          font-size: 0.84rem;
          color: var(--color-text-secondary, #94a3b8);
          line-height: 1.4;
        }
        .user-modal-highlight {
          color: var(--color-text-primary, #f8fafc);
        }

        .admin-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .admin-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .admin-form-label {
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #94a3b8);
        }
        .input-with-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          color: var(--color-text-secondary, #94a3b8);
          pointer-events: none;
        }
        .admin-form-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          color: var(--color-text-primary, #f8fafc);
          font-size: 0.92rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .admin-form-input:focus {
          border-color: var(--color-accent, #06b6d4);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
          background: rgba(15, 23, 42, 0.8);
        }
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--color-text-secondary, #94a3b8);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .admin-form-select {
          width: 100%;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          color: var(--color-text-primary, #f8fafc);
          font-size: 0.92rem;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .admin-form-select:focus {
          border-color: var(--color-accent, #06b6d4);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
        }
        .modal-actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        /* Modal Eliminar */
        .admin-modal-content.delete-center {
          text-align: center;
          padding: 10px 6px;
        }
        .delete-warning-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .delete-desc {
          margin: 0 0 24px 0;
          font-size: 0.92rem;
          line-height: 1.5;
        }
        .delete-actions {
          justify-content: center;
        }

        /* ========================================================
           ADAPTACIÓN PARA TEMA CLARO [data-theme="light"]
           ======================================================== */
        [data-theme="light"] .superadmin-h1 {
          color: #0f172a !important;
        }
        [data-theme="light"] .superadmin-subtitle {
          color: #475569 !important;
        }
        [data-theme="light"] .superadmin-gradient-text {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        [data-theme="light"] .superadmin-badge {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0369a1 !important;
        }
        [data-theme="light"] .superadmin-btn-secondary {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        [data-theme="light"] .superadmin-btn-secondary:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        [data-theme="light"] .superadmin-btn-primary {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25) !important;
        }
        [data-theme="light"] .superadmin-btn-primary:hover {
          background: linear-gradient(135deg, #0369a1 0%, #075985 100%) !important;
        }

        /* Métricas Bento en Modo Claro */
        [data-theme="light"] .superadmin-stat-card {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .superadmin-stat-card:hover {
          box-shadow: 0 8px 25px -4px rgba(15, 23, 42, 0.1) !important;
          border-color: #cbd5e1 !important;
        }
        [data-theme="light"] .stat-label {
          color: #64748b !important;
        }
        [data-theme="light"] .stat-value {
          color: #0f172a !important;
        }
        [data-theme="light"] .stat-footer-pill.cyan {
          background: #f0fdfa !important;
          color: #0d9488 !important;
          border-color: #99f6e4 !important;
        }
        [data-theme="light"] .stat-footer-pill.amber {
          background: #fffbeb !important;
          color: #b45309 !important;
          border-color: #fde68a !important;
        }
        [data-theme="light"] .stat-footer-pill.blue {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border-color: #bfdbfe !important;
        }

        /* Banner en Modo Claro */
        [data-theme="light"] .superadmin-policy-banner {
          background: #f0f9ff !important;
          border-color: #bae6fd !important;
        }
        [data-theme="light"] .policy-icon-wrapper {
          color: #0284c7 !important;
        }
        [data-theme="light"] .policy-text {
          color: #334155 !important;
        }
        [data-theme="light"] .policy-text strong {
          color: #0f172a !important;
        }
        [data-theme="light"] .policy-highlight {
          color: #0369a1 !important;
        }

        /* Toolbar en Modo Claro */
        [data-theme="light"] .superadmin-search-input {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .superadmin-search-input:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
        }
        [data-theme="light"] .superadmin-count-tag {
          color: #64748b !important;
        }
        [data-theme="light"] .superadmin-count-tag strong {
          color: #0f172a !important;
        }

        /* Tabla en Modo Claro */
        [data-theme="light"] .superadmin-table-card {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .superadmin-table thead tr {
          background: #f8fafc !important;
          border-bottom-color: #e2e8f0 !important;
        }
        [data-theme="light"] .superadmin-table th {
          color: #64748b !important;
        }
        [data-theme="light"] .table-data-row {
          border-bottom-color: #f1f5f9 !important;
        }
        [data-theme="light"] .table-data-row:hover {
          background-color: #f8fafc !important;
        }
        [data-theme="light"] .user-full-name {
          color: #0f172a !important;
        }
        [data-theme="light"] .user-id-chip {
          background: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
          color: #64748b !important;
        }
        [data-theme="light"] .user-id-chip:hover {
          background: #e0f2fe !important;
          border-color: #7dd3fc !important;
          color: #0369a1 !important;
        }
        [data-theme="light"] .email-row {
          color: #475569 !important;
        }
        [data-theme="light"] .date-row {
          color: #64748b !important;
        }

        /* Botones de Acción en Modo Claro */
        [data-theme="light"] .action-btn-styled.key-btn {
          background: #f0fdfa !important;
          color: #0f766e !important;
          border-color: #99f6e4 !important;
        }
        [data-theme="light"] .action-btn-styled.key-btn:hover {
          background: #ccfbf1 !important;
          border-color: #5eead4 !important;
        }
        [data-theme="light"] .action-btn-styled.edit-btn {
          background: #f8fafc !important;
          color: #1e293b !important;
          border-color: #cbd5e1 !important;
        }
        [data-theme="light"] .action-btn-styled.edit-btn:hover {
          background: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
        [data-theme="light"] .action-btn-styled.delete-btn {
          background: #fef2f2 !important;
          color: #dc2626 !important;
          border-color: #fecaca !important;
        }
        [data-theme="light"] .action-btn-styled.delete-btn:hover {
          background: #fee2e2 !important;
          border-color: #fca5a5 !important;
        }

        /* Modales en Modo Claro */
        [data-theme="light"] .modal-title {
          color: #0f172a !important;
        }
        [data-theme="light"] .modal-desc {
          color: #64748b !important;
        }
        [data-theme="light"] .user-modal-highlight {
          color: #0f172a !important;
        }
        [data-theme="light"] .admin-form-label {
          color: #475569 !important;
        }
        [data-theme="light"] .admin-form-input {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .admin-form-input:focus {
          background: #ffffff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
        }
        [data-theme="light"] .admin-form-select {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .admin-form-select:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
        }

        /* Responsive Mobile (Android UI/UX Optimizado) */
        @media (max-width: 768px) {
          .superadmin-hero-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            margin-bottom: 20px;
          }
          .superadmin-header-actions {
            width: 100%;
            gap: 10px;
          }
          .superadmin-btn-primary, .superadmin-btn-secondary {
            flex: 1;
            justify-content: center;
            min-height: 44px;
            padding: 10px 14px;
            font-size: 0.88rem;
          }
          .superadmin-h1 {
            font-size: 1.75rem;
            line-height: 1.2;
          }
          .superadmin-subtitle {
            font-size: 0.86rem;
            line-height: 1.45;
          }

          /* Grid de Métricas en 2 Columnas para Android */
          .superadmin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .superadmin-stat-card {
            padding: 12px 10px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            box-sizing: border-box;
          }
          .superadmin-stat-card.card-total {
            grid-column: span 2;
            padding: 12px 14px;
          }
          .stat-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 4px;
            margin-bottom: 6px;
          }
          .stat-label {
            font-size: 0.68rem;
            font-weight: 750;
            line-height: 1.25;
            letter-spacing: 0.01em;
            word-break: normal;
            hyphens: none;
            overflow-wrap: normal;
          }
          .stat-icon-box {
            width: 28px;
            height: 28px;
            min-width: 28px;
            min-height: 28px;
            border-radius: 8px;
            flex-shrink: 0;
          }
          .stat-icon-box svg {
            width: 15px;
            height: 15px;
          }
          .stat-value {
            font-size: 1.65rem;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
          }
          .stat-footer-pill {
            display: flex;
            align-items: flex-start;
            gap: 5px;
            font-size: 0.64rem;
            font-weight: 600;
            line-height: 1.35;
            padding: 5px 6px;
            border-radius: 6px;
            margin-top: auto;
            word-break: normal;
            overflow-wrap: break-word;
          }
          .stat-footer-pill span:last-child {
            flex: 1;
            word-break: normal;
          }
          .pill-dot {
            width: 5px;
            height: 5px;
            min-width: 5px;
            min-height: 5px;
            border-radius: 50%;
            margin-top: 3px;
            flex-shrink: 0;
          }

          .superadmin-policy-banner {
            padding: 12px 14px;
            margin-bottom: 18px;
            gap: 10px;
          }
          .policy-text {
            font-size: 0.82rem;
            line-height: 1.45;
          }

          /* Toolbar Búsqueda Mobile */
          .superadmin-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .superadmin-search-wrapper {
            max-width: 100%;
            flex: 1 1 100%;
          }

          /* Transformación de Tabla a Cards Mobile (Cero Scroll Horizontal) */
          .superadmin-table-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .table-responsive-container {
            overflow-x: visible !important;
            width: 100% !important;
          }
          .superadmin-table {
            display: block !important;
            width: 100% !important;
          }
          .superadmin-table thead {
            display: none !important;
          }
          .superadmin-table tbody {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .table-data-row {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            grid-template-areas:
              "name name"
              "email email"
              "date actions" !important;
            row-gap: 12px !important;
            column-gap: 10px !important;
            align-items: center !important;
            background: var(--color-surface, #0f172a) !important;
            border: 1px solid rgba(148, 163, 184, 0.16) !important;
            border-radius: 16px !important;
            padding: 16px !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .table-data-row:hover {
            background: var(--color-surface, #0f172a) !important;
          }
          .user-name-cell {
            grid-area: name !important;
            padding: 0 !important;
            border: none !important;
            width: 100% !important;
          }
          .user-avatar-row {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .user-avatar {
            width: 40px !important;
            height: 40px !important;
            font-size: 0.95rem !important;
            flex-shrink: 0 !important;
            margin-top: 0 !important;
          }
          .user-details-col {
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .user-full-name {
            font-size: 0.96rem !important;
            font-weight: 750 !important;
            line-height: 1.3 !important;
            color: var(--color-text-primary, #f8fafc) !important;
            word-break: break-word !important;
          }
          .user-meta-badges-row {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: wrap !important;
            margin-top: 3px !important;
          }
          .desktop-role-cell {
            display: none !important;
          }
          .mobile-role-badge {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 3px 8px !important;
            font-size: 0.68rem !important;
            font-weight: 750 !important;
            border-radius: 6px !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
          }
          .user-id-chip {
            padding: 3px 7px !important;
            font-size: 0.7rem !important;
            border-radius: 6px !important;
            margin-top: 0 !important;
          }
          .user-email-cell {
            grid-area: email !important;
            padding: 9px 12px !important;
            background: rgba(148, 163, 184, 0.06) !important;
            border: 1px solid rgba(148, 163, 184, 0.12) !important;
            border-radius: 9px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .email-row {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            color: var(--color-text-secondary, #94a3b8) !important;
            overflow: hidden !important;
          }
          .email-icon {
            flex-shrink: 0 !important;
            opacity: 0.8 !important;
          }
          .email-text {
            font-size: 0.84rem !important;
            font-weight: 500 !important;
            word-break: break-all !important;
            color: var(--color-text-primary, #f8fafc) !important;
          }
          .user-date-cell {
            grid-area: date !important;
            padding: 0 !important;
            border: none !important;
            align-self: center !important;
            display: flex !important;
            align-items: center !important;
            height: auto !important;
          }
          .date-row {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            font-size: 0.78rem !important;
            color: var(--color-text-secondary, #94a3b8) !important;
            line-height: 1 !important;
          }
          .date-icon {
            flex-shrink: 0 !important;
            opacity: 0.7 !important;
          }
          .user-actions-cell {
            grid-area: actions !important;
            padding: 0 !important;
            border: none !important;
            justify-self: end !important;
            align-self: center !important;
          }
          .action-buttons-group {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .action-btn-styled {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 7px 11px !important;
            min-height: 36px !important;
            font-size: 0.78rem !important;
            font-weight: 600 !important;
            gap: 5px !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
          }
          .btn-label-text {
            display: inline;
          }
          @media (max-width: 380px) {
            .btn-label-text {
              display: none;
            }
            .action-btn-styled {
              padding: 7px 8px;
            }
          }
          [data-theme="light"] .table-data-row {
            background: #ffffff !important;
            border-color: #e2e8f0 !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05) !important;
          }
          [data-theme="light"] .user-email-cell {
            background: #f8fafc !important;
            border-color: #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
}
