const { Client } = require('pg');

const projectRef = 'rctfyjwmjcrahcuwzwaf';
const password = 'AniNexo@123';

async function test(port) {
  const host = `aws-0-us-east-1.pooler.supabase.com`;
  const user = `postgres.${projectRef}`;
  
  console.log(`Probando pg en ${host}:${port} con usuario ${user}...`);
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ ¡ÉXITO! Conexión exitosa en puerto ${port}`);
    const res = await client.query('SELECT 1');
    console.log('Resultado query:', res.rows);
    await client.end();
  } catch (err) {
    console.log(`❌ Falla en puerto ${port}: ${err.message}`);
    try { await client.end(); } catch (e) {}
  }
}

async function run() {
  await test(6543);
  await test(5432);
}

run();
