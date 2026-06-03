import { PrismaClient } from '@prisma/client';

const ip = '2600:1f1e:dbb:f601:bcc0:39f2:1c02:a5b';
const passwords = ['AniNexo@123', '[AniNexo@123]'];

async function test(password: string) {
  const encodedPwd = encodeURIComponent(password);
  const url = `postgresql://postgres:${encodedPwd}@[${ip}]:5432/postgres`;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ EXITO DIRECTO IPv6: pwd=${password}`);
    console.log(`URL direct working: ${url}`);
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    console.log(`❌ Falla directo IPv6: pwd=${password} -> ${error.message.substring(0, 150)}`);
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  for (const p of passwords) {
    const ok = await test(p);
    if (ok) return;
  }
}

run();
