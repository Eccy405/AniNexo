import prisma from './lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro_aqui';
const API_URL = 'http://localhost:3001/api';

async function main() {
  console.log('Finding an admin user...');
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'ADMIN' },
        { role: 'SUPERADMIN' }
      ]
    }
  });

  if (!admin) {
    console.error('No admin user found in database!');
    return;
  }

  console.log(`Found admin: @${admin.username} (Role: ${admin.role}, ID: ${admin.id})`);

  // Generate JWT token
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('Generated JWT Token successfully.');

  const endpoints = [
    '/admin/analytics',
    '/admin/stats',
    '/admin/reports',
    '/admin/users',
    '/admin/finances',
    '/admin/anime',
    '/admin/nexo-logs',
    '/admin/telemetry',
    '/admin/logs',
    '/admin/email-logs',
    '/admin/settings'
  ];

  console.log('\nTesting admin endpoints...');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  for (const path of endpoints) {
    try {
      const res = await fetch(`${API_URL}${path}`, { headers });
      console.log(`Endpoint ${path}: Status ${res.status}`);
      if (res.status === 200) {
        const data = await res.json() as any;
        console.log(`  -> Success: ${data.success}, Keys in data: ${data.data ? Object.keys(data.data) : 'none'}`);
      } else {
        const text = await res.text();
        console.log(`  -> Error response: ${text.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.error(`  -> Failed to fetch ${path}:`, error.message);
    }
  }
}

main().catch(err => console.error('Error running API test:', err));
