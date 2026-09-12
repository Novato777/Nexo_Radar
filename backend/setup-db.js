const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const password = 'password123'; // La que vimos en la consola

async function setup() {
  console.log('1. Conectando a PostgreSQL (servidor general)...');
  const clientMaster = new Client({
    user: 'postgres',
    host: 'localhost',
    password: password,
    port: 5432,
    database: 'postgres'
  });

  try {
    await clientMaster.connect();
    
    // Check if db exists
    const res = await clientMaster.query("SELECT 1 FROM pg_database WHERE datname = 'nexo_radar'");
    if (res.rowCount === 0) {
      console.log('2. Creando la base de datos NeXo_Radar...');
      await clientMaster.query('CREATE DATABASE nexo_radar');
    } else {
      console.log('2. La base de datos NeXo_Radar ya existe.');
    }
  } catch (e) {
    console.error('Error al conectar al servidor general:', e);
    return;
  } finally {
    await clientMaster.end();
  }

  console.log('3. Conectando a NeXo_Radar para crear las tablas...');
  const clientNexo = new Client({
    user: 'postgres',
    host: 'localhost',
    password: password,
    port: 5432,
    database: 'nexo_radar'
  });

  try {
    await clientNexo.connect();
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database.sql');
    const sqlString = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('4. Ejecutando el script de tablas...');
    await clientNexo.query(sqlString);
    console.log('¡TODO LISTO! Las tablas de NeXo Radar han sido creadas con éxito.');
  } catch (e) {
    console.error('Error al crear las tablas:', e);
  } finally {
    await clientNexo.end();
  }
}

setup();
