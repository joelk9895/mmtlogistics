import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  console.log('Seeding users...');

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@mmt.com' },
    update: {},
    create: {
      email: 'admin@mmt.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Driver
  await prisma.user.upsert({
    where: { email: 'driver@mmt.com' },
    update: {},
    create: {
      email: 'driver@mmt.com',
      password: driverPassword,
      role: 'DRIVER',
    },
  });

  // Customer
  await prisma.user.upsert({
    where: { email: 'customer@mmt.com' },
    update: {},
    create: {
      email: 'customer@mmt.com',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('Users seeded successfully!');
  console.log('Admin: admin@mmt.com / admin123');
  console.log('Driver: driver@mmt.com / driver123');
  console.log('Customer: customer@mmt.com / customer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
