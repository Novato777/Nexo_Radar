const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// GET /api/users
// Lista todos los colaboradores y administradores del sistema
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Error obteniendo colaboradores]:', error);
    res.status(500).json({ error: 'Error al obtener lista de colaboradores' });
  }
});

// POST /api/users
// Agrega un nuevo colaborador
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role = 'colaborador' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos (nombre, usuario/correo y contraseña) son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Comprobar si ya existe
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario o colaborador registrado con este correo o identificador' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), cleanEmail, password_hash, role || 'colaborador']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Error al crear colaborador]:', error);
    res.status(500).json({ error: 'Error al registrar colaborador' });
  }
});

// PUT /api/users/:id
// Edita los datos básicos de un colaborador
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'El nombre y correo/usuario son obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validar que el correo no esté ocupado por otro usuario distinto
    const checkEmail = await db.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2', [cleanEmail, id]);
    if (checkEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Este correo o identificador ya está en uso por otro colaborador' });
    }

    const result = await db.query(
      `UPDATE users 
       SET name = $1, email = $2, role = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, name, email, role, created_at`,
      [name.trim(), cleanEmail, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Error al actualizar colaborador]:', error);
    res.status(500).json({ error: 'Error al actualizar colaborador' });
  }
});

// PATCH /api/users/:id/password
// Restablece o cambia la contraseña de un colaborador
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email, role',
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }

    res.json({ success: true, message: 'Contraseña actualizada correctamente para ' + result.rows[0].name });
  } catch (error) {
    console.error('[Error al cambiar contraseña]:', error);
    res.status(500).json({ error: 'Error al actualizar la contraseña del colaborador' });
  }
});

// DELETE /api/users/:id
// Elimina un colaborador del sistema
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }

    res.json({ success: true, message: `Colaborador ${result.rows[0].name} eliminado del sistema` });
  } catch (error) {
    console.error('[Error al eliminar colaborador]:', error);
    res.status(500).json({ error: 'Error al eliminar colaborador' });
  }
});

module.exports = router;
