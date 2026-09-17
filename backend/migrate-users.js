require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function migrateUsers() {
  console.log('[Migración] Verificando tabla users y roles...');
  try {
    // 1. Asegurar extensión uuid de forma tolerante (si no tiene permisos superuser, usa gen_random_uuid nativo)
    try {
      await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch (extErr) {
      console.warn('[Migración] uuid-ossp omitido (usando gen_random_uuid nativo):', extErr.message);
    }

    // 2. Crear tabla users si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'colaborador',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2.1 Crear tabla businesses si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name VARCHAR(150) NOT NULL,
        owner_name VARCHAR(100),
        phone VARCHAR(50),
        city VARCHAR(100),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        qr_token VARCHAR(50) UNIQUE,
        status VARCHAR(50) DEFAULT 'ACTIVO',
        logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2.2 Crear tabla service_requests si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        type VARCHAR(100),
        message TEXT,
        status VARCHAR(50) DEFAULT 'NUEVA',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        viewed_at TIMESTAMP WITH TIME ZONE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        attended_by VARCHAR(150),
        resolved_by VARCHAR(150)
      );
    `);

    // 3. Asegurar que columnas necesarias existan
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'colaborador';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='businesses' AND column_name='logo_url'
        ) THEN
          ALTER TABLE businesses ADD COLUMN logo_url TEXT;
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
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
