const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
// Valida credenciales de comercial
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // TODO: Implementar validación real con JWT y bcrypt
  res.json({ message: 'Login endpoint pendiente de implementación' });
});

module.exports = router;
