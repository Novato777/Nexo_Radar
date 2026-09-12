import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HomeDashboard from './pages/HomeDashboard';
import RegisterBusiness from './pages/RegisterBusiness';
import ClientPortal from './pages/ClientPortal';
import AlertCenter from './pages/AlertCenter';
import Login from './pages/Login';
import RadarMap from './pages/RadarMap';
import DatabaseView from './pages/DatabaseView';
import { SocketProvider } from './context/SocketContext';
import './index.css';
import 'leaflet/dist/leaflet.css';

import Layout from './components/Layout';

// Componente para proteger rutas y envolverlas en el Layout
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('nexo_auth');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/qr/:token" element={<ClientPortal />} />
        
        {/* Rutas Privadas del Equipo NeXo */}
        <Route path="/" element={<PrivateRoute><HomeDashboard /></PrivateRoute>} />
        <Route path="/terminales" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/register" element={<PrivateRoute><RegisterBusiness /></PrivateRoute>} />
        <Route path="/alertas" element={<PrivateRoute><AlertCenter /></PrivateRoute>} />
        <Route path="/mapa" element={<PrivateRoute><RadarMap /></PrivateRoute>} />
        <Route path="/base-de-datos" element={<PrivateRoute><DatabaseView /></PrivateRoute>} />
      </Routes>
    </SocketProvider>
  );
}

export default App;

