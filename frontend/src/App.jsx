import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HomeDashboard from './pages/HomeDashboard';
import RegisterBusiness from './pages/RegisterBusiness';
import ClientPortal from './pages/ClientPortal';
import AlertCenter from './pages/AlertCenter';
import Login from './pages/Login';
import RadarMap from './pages/RadarMap';
import DatabaseView from './pages/DatabaseView';
import SuperAdmin from './pages/SuperAdmin';
import Landing from './pages/Landing';
import Settings from './pages/Settings';
import { SocketProvider } from './context/SocketContext';
import './index.css';
import 'leaflet/dist/leaflet.css';

import Layout from './components/Layout';

// Componente para proteger rutas generales y envolverlas en el Layout
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('nexo_auth');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

// Componente para proteger rutas exclusivas de Administradores (Base de Datos y Super Admin)
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('nexo_auth');
  if (!token) return <Navigate to="/login" />;

  try {
    const storedUser = localStorage.getItem('nexo_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const role = (user.role || '').toLowerCase();
      const isAdmin = role === 'admin' || role === 'superadmin';
      if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  } catch (err) {
    console.debug('Error comprobando rol de admin:', err);
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <SocketProvider>
      <Routes>
        {/* Rutas Públicas - Prioridad Máxima a la Landing Page como portada principal */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/qr/:token" element={<ClientPortal />} />
        
        {/* Rutas Compartidas (Colaboradores y Administradores) */}
        <Route path="/dashboard" element={<PrivateRoute><HomeDashboard /></PrivateRoute>} />
        <Route path="/terminales" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/register" element={<PrivateRoute><RegisterBusiness /></PrivateRoute>} />
        <Route path="/alertas" element={<PrivateRoute><AlertCenter /></PrivateRoute>} />
        <Route path="/mapa" element={<PrivateRoute><RadarMap /></PrivateRoute>} />
        <Route path="/configuracion" element={<PrivateRoute><Settings /></PrivateRoute>} />
        
        {/* Rutas Restringidas Exclusivas de Administradores */}
        <Route path="/base-de-datos" element={<AdminRoute><DatabaseView /></AdminRoute>} />
        <Route path="/colaboradores" element={<AdminRoute><SuperAdmin /></AdminRoute>} />
        <Route path="/superadmin" element={<Navigate to="/colaboradores" replace />} />
        
        {/* Fallback de rutas no encontradas -> redirigir a portada principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
