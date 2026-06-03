const net = require('net');
const dns = require('dns');

const projectRef = 'rctfyjwmjcrahcuwzwaf';
const regions = ['us-east-1', 'us-east-2', 'sa-east-1', 'us-west-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1'];

function checkPort(host, port) {
  return new Promise((resolve) => {
    console.log(`Intentando conectar a ${host}:${port}...`);
    const socket = new net.Socket();
    let connError = null;

    socket.setTimeout(3000);

    socket.on('connect', () => {
      console.log(`✅ ${host}:${port} está ABIERTO`);
      socket.destroy();
      resolve({ host, port, open: true });
    });

    socket.on('timeout', () => {
      console.log(`❌ ${host}:${port} TIMEOUT`);
      socket.destroy();
      resolve({ host, port, open: false, error: 'Timeout' });
    });

    socket.on('error', (err) => {
      console.log(`❌ ${host}:${port} ERROR: ${err.message}`);
      socket.destroy();
      resolve({ host, port, open: false, error: err.message });
    });

    socket.connect(port, host);
  });
}

async function run() {
  console.log('--- Probando Puertos TCP ---');
  
  // Probar conexión IPv6 directa
  await checkPort(`db.${projectRef}.supabase.co`, 5432);

  // Probar conexión IPv4 pooler en cada región
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    await checkPort(host, 6543);
  }
}

run();
