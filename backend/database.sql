-- Archivo de inicialización de la base de datos (PostgreSQL) para NeXo Radar

-- Extensión para IDs únicos (opcional pero recomendado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios (Comerciales y Admins de NeXo)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'comercial', -- 'comercial' o 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Negocios (Registrados por los comerciales)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100),
    phone VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    qr_token VARCHAR(50) UNIQUE, -- Token único del código QR (ej. A7F9X2)
    status VARCHAR(50) DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Solicitudes (Hechas por los clientes al escanear el QR)
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(100), -- ej. 'Soporte', 'Ventas', 'Consulta'
    message TEXT,
    status VARCHAR(50) DEFAULT 'NUEVA', -- 'NUEVA', 'VISTA', 'CERRADA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    viewed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Opcional: Insertar un usuario admin de prueba (La contraseña hasheada aquí es solo un placeholder)
-- INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@nexoradar.com', 'hash_aqui', 'admin');
