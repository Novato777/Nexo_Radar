const { Client } = require('pg');
const password = 'password123'; 

async function updateDb() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: password,
    port: 5432,
    database: 'nexo_radar'
  });

  try {
    await client.connect();
    console.log('Añadiendo columna logo_url...');
    await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;');
    console.log('¡Columna añadida con éxito!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

updateDb();
