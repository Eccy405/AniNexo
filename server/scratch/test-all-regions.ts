import { PrismaClient } from '@prisma/client';

const projectRef = 'rctfyjwmjcrahcuwzwaf';
const passwords = ['AniNexo@123', '[AniNexo@123]'];
const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1', 'eu-west-1', 'eu-west-2',
  'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'me-central-1', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'af-south-1'
];

async function test(password: string, region: string) {
  const encodedPwd = encodeURIComponent(password);
  const url = `postgresql://postgres.${projectRef}:${encodedPwd}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ EXITO: pwd=${password}, region=${region}`);
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    const errMsg = error.message;
    // Si no contiene "tenant/user not found" o "Tenant or user not found"
    if (!errMsg.includes('tenant/user') && !errMsg.includes('Tenant or user')) {
      console.log(`❓ Posible región ${region} (con pwd=${password}) -> Error: ${errMsg.substring(0, 150)}`);
    }
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  console.log('Iniciando escaneo de regiones en Prisma...');
  for (const r of regions) {
    for (const p of passwords) {
      const ok = await test(p, r);
      if (ok) {
        console.log(`\n🎉 ENCONTRADO FUNCIONANDO EN ${r}!`);
        return;
      }
    }
  }
  console.log('Escaneo finalizado.');
}

run();
