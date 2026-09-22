import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'driver@mmt.com' },
  });

  if (!user) {
    console.log('Driver user not found');
    return;
  }

  if (user.driverId) {
    console.log('Driver already linked!');
    return;
  }

  console.log('Creating driver profile and linking...');

  const driver = await prisma.driver.create({
    data: {
      employeeId: 'EMP-DRV-001',
      firstName: 'Test',
      lastName: 'Driver',
      dateOfBirth: new Date('1990-01-01'),
      phone: '1234567890',
      currentAddress: 'Test Address',
      emergencyContactName: 'Test Emergency',
      emergencyContactPhone: '0987654321',
      emergencyContactRelation: 'Friend',
      dateOfJoining: new Date(),
      licenseNumber: 'TEST-LIC-' + Math.floor(Math.random() * 10000),
      licenseIssueDate: new Date(),
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { driverId: driver.id },
  });

  console.log('Successfully linked driver profile!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
