import prisma from '../src/lib/prisma';

async function main() {
  console.log('Modelos disponibles en Prisma Client:');
  console.log(Object.keys(prisma).filter(k => !k.startsWith('_')));
}

main().catch(console.error);
