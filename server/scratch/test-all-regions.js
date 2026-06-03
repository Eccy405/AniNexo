const { Client } = require('pg');

const projectRef = 'rctfyjwmjcrahcuwzwaf';
const password = 'AniNexo@123'; // or '[AniNexo@123]'
const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1', 'eu-west-1', 'eu-west-2',
  'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'me-central-1', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'af-south-1'
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client1 = new Client({
    host,
    port: 6543,
    user: `postgres.${projectRef}`,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  const client2 = new Client({
    host,
    port: 6543,
    user: `postgres.${projectRef}`,
    password: `[${password}]`,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  try {
    await client1.connect();
    console.log(`✅ EXITO: ${region} con pwd=AniNexo@123`);
    await client1.end();
    return true;
  } catch (err1) {
    // Si no es un error de "tenant not found", podría ser la región correcta
    const msg1 = err1.message;
    if (!msg1.includes('tenant/user') && !msg1.includes('Tenant or user')) {
      console.log(`❓ Posible región ${region} (con pwd=AniNexo@123) -> Error: ${msg1}`);
    }

    try {
      await client2.connect();
      console.log(`✅ EXITO: ${region} con pwd=[AniNexo@123]`);
      await client2.end();
      return true;
    } catch (err2) {
      const msg2 = err2.message;
      if (!msg2.includes('tenant/user') && !msg2.includes('Tenant or user')) {
        console.log(`❓ Posible región ${region} (con pwd=[AniNexo@123]) -> Error: ${msg2}`);
      }
    }
  }
  return false;
}

async function run() {
  console.log('Iniciando escaneo de todas las regiones de Supabase...');
  for (const region of regions) {
    const ok = await testRegion(region);
    if (ok) {
      console.log(`\n🎉 ENCONTRADO EN ${region}!`);
      return;
    }
  }
  console.log('Escaneo finalizado.');
}

run();
