const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nexo-radar-secure-jwt-key-2026';

// Controlador de Login
const handleLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!password) {
      return res.status(400).json({ success: false, message: 'Por favor ingresa tu contraseña' });
    }

    // 1. Intentar validar contra la base de datos de usuarios
    if (identifier) {
      const userRes = await db.query(
        'SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1',
        [identifier]
      );

      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (isMatch) {
          const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '30d' }
          );

          return res.json({
            success: true,
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role || 'colaborador'
            }
          });
        }
      }
    }

    // 2. Fallback de compatibilidad: Validación con Master Password
    if (password === process.env.MASTER_PASSWORD) {
      const token = jwt.sign(
        { id: 'master-admin', email: 'admin@nexoradar.com', role: 'superadmin', name: identifier || 'Super Admin NeXo' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 'master-admin',
          name: identifier || 'Super Admin NeXo',
          email: 'admin@nexoradar.com',
          role: 'superadmin'
        }
      });
    }

    // Si no coincide ni con BD ni con Master Password
    return res.status(401).json({ 
      success: false, 
      message: 'Usuario o contraseña incorrectos. Verifica tus credenciales.' 
    });

  } catch (error) {
    console.error('[Error en Login]:', error);
    res.status(500).json({ success: false, message: 'Error interno en el servidor de autenticación' });
  }
};

// POST /api/auth/login
router.post('/login', handleLogin);

// GET /api/auth/me - Verifica el token y estado del usuario
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

module.exports = router;
module.exports.handleLogin = handleLogin;
