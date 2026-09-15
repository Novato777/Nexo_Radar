require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function migrateUsers() {
  console.log('[Migración] Verificando tabla users y roles...');
  try {
    // 1. Asegurar extensión uuid
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // 2. Crear tabla users si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'colaborador',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Asegurar que la columna role existe
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'colaborador';
        END IF;

        -- Columnas para trazabilidad de colaboradores en solicitudes
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='service_requests' AND column_name='attended_by'
        ) THEN
          ALTER TABLE service_requests ADD COLUMN attended_by VARCHAR(150);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='service_requests' AND column_name='resolved_by'
        ) THEN
          ALTER TABLE service_requests ADD COLUMN resolved_by VARCHAR(150);
        END IF;
      END $$;
    `);

    // 4. Tabla para suscripciones Web Push en Android y navegadores
    await db.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Verificar si ya existe al menos un usuario administrador
    const existingAdmins = await db.query("SELECT id, email, role FROM users WHERE role IN ('admin', 'superadmin')");
    if (existingAdmins.rows.length === 0) {
      console.log('[Migración] Creando usuario Super Admin inicial...');
      const defaultPassword = process.env.MASTER_PASSWORD || 'nexo2026';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(defaultPassword, salt);

      await db.query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
      `, ['Super Administrador NeXo', 'admin@nexoradar.com', hash, 'superadmin']);

      console.log('✅ Super Admin creado con éxito (email: admin@nexoradar.com)');
    } else {
      console.log(`[Migración] Existen ${existingAdmins.rows.length} administradores en el sistema.`);
    }

    console.log('✅ Migración de usuarios completada con éxito.');
  } catch (err) {
    console.error('[Error en migración de usuarios]:', err.message);
  }
}

if (require.main === module) {
  migrateUsers().then(() => process.exit(0));
}

module.exports = migrateUsers;
