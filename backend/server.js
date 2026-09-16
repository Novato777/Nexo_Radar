require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configurar trust proxy para proxies inversos (Render / Cloudflare / Vercel)
app.set('trust proxy', 1);

// Configuración de Socket.IO con CORS abierto para el panel
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
  });
});

// Middlewares de Seguridad y Hardening
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite servir logos de /uploads
  contentSecurityPolicy: false // Evita bloqueos en mapas Leaflet y CDNs
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
}));

// Límites de tamaño de payload para evitar saturación de memoria
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Endpoint ligero de salud / Keep-Alive (Ping) para prevenir cold-starts sin consultar la base de datos
// Ubicado ANTES del Rate Limiter para garantizar disponibilidad del 100% y 0 consumo de cuota
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Rate Limiting General para protección contra abusos (no estrangular lecturas de monitoreo ni sockets)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // No bloquear lecturas de monitoreo en tiempo real
  message: { error: 'Demasiadas peticiones desde esta IP, intenta más tarde.' }
});
app.use('/api', generalLimiter);

// Rate Limiting Estricto para Login (Anti-Fuerza Bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de acceso. Intenta en 15 minutos.' }
});

// Servir archivos estáticos subidos (logos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const pushRoutes = require('./routes/push');
const migrateUsers = require('./migrate-users');

// Ejecutar migración de usuarios al iniciar el servidor
migrateUsers().catch(e => console.warn('[Auto-Migrate users warning]:', e.message));

// Use Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/push', pushRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'NeXo Radar API v1 - Protegida y en Tiempo Real' });
});

const { getCloudinaryStatus } = require('./config/cloudinary');

// Endpoint de login compatible con frontend directo (/api/login y /api/auth/login)
app.post('/api/login', authLimiter, authRoutes.handleLogin);

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API is running', 
    version: '1.0.0', 
    realtime: 'active',
    security: 'helmet+ratelimit' 
  });
});

// Endpoint diagnóstico de Cloudinary (ayuda a depurar despliegues en Render/Vercel)
app.get('/api/health/cloudinary', (req, res) => {
  res.json(getCloudinaryStatus());
});

// Manejador global de errores para no filtrar trazas sensibles en producción
app.use((err, req, res, next) => {
  console.error('[Error de Servidor]:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : (err.message || 'Error inesperado')
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[NeXo Radar Backend] Servidor seguro y Socket.IO escuchando en puerto ${PORT}`);
  const cStatus = getCloudinaryStatus();
  if (cStatus.configured) {
    console.log(`[Cloudinary CDN] Conectado exitosamente. Cloud Name: ${cStatus.cloud_name}`);
  } else {
    console.warn('[Cloudinary CDN] ⚠️ ADVERTENCIA: Cloudinary no está configurado.');
    console.warn('[Cloudinary CDN] ⚠️ En producción (Render/Vercel), las imágenes se perderán al reiniciar el servidor.');
    console.warn('[Cloudinary CDN] ⚠️ Configura CLOUDINARY_URL en las variables de entorno de Render para almacenamiento permanente.');
  }
});


