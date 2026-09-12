const { Client } = require('pg');
const password = 'password123'; 

async function checkDb() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: password,
    port: 5432,
    database: 'nexo_radar'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, business_name, logo_url FROM businesses;');
    console.log(res.rows);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

checkDb();
