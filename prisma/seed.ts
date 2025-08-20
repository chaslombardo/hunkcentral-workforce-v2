import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@collegehunks.com' },
    update: {},
    create: {
      email: 'admin@collegehunks.com',
      password: adminPassword,
      fullName: 'System Administrator',
      roles: ['admin', 'manager'],
      // Set default rates
      rateJunkCaptain: 20.0,
      rateJunkWingman: 15.0,
      rateMoveCaptain: 22.0,
      rateMoveWingman: 17.0,
      rateZigma: 18.0,
      rateTraining: 16.0,
      rateEstimating: 25.0,
      rateWarehouse: 14.0,
      rateAdmin: 20.0,
      commissionRate: 5.0,
    },
  });

  // Create sample captain
  const captainPassword = await bcrypt.hash('captain123', 12);
  const captain = await prisma.user.upsert({
    where: { email: 'captain@collegehunks.com' },
    update: {},
    create: {
      email: 'captain@collegehunks.com',
      password: captainPassword,
      fullName: 'John Captain',
      roles: ['captain'],
      rateJunkCaptain: 20.0,
      rateJunkWingman: 15.0,
      rateMoveCaptain: 22.0,
      rateMoveWingman: 17.0,
    },
  });

  // Create sample wingman
  const wingmanPassword = await bcrypt.hash('wingman123', 12);
  const wingman = await prisma.user.upsert({
    where: { email: 'wingman@collegehunks.com' },
    update: {},
    create: {
      email: 'wingman@collegehunks.com',
      password: wingmanPassword,
      fullName: 'Mike Wingman',
      roles: ['wingman'],
      rateJunkWingman: 15.0,
      rateMoveWingman: 17.0,
    },
  });

  // Create sample sales user
  const salesPassword = await bcrypt.hash('sales123', 12);
  const sales = await prisma.user.upsert({
    where: { email: 'sales@collegehunks.com' },
    update: {},
    create: {
      email: 'sales@collegehunks.com',
      password: salesPassword,
      fullName: 'Sarah Sales',
      roles: ['sales'],
      commissionRate: 8.0,
    },
  });

  // Create sample manager
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@collegehunks.com' },
    update: {},
    create: {
      email: 'manager@collegehunks.com',
      password: managerPassword,
      fullName: 'Lisa Manager',
      roles: ['manager'],
      rateAdmin: 25.0,
    },
  });

  // Create initial pay period
  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start of current week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week

  const payPeriodName = `Week of ${startOfWeek.toISOString().split('T')[0]}`;

  // Check if pay period already exists
  const existingPayPeriod = await prisma.payPeriod.findFirst({
    where: { name: payPeriodName },
  });

  const payPeriod =
    existingPayPeriod ||
    (await prisma.payPeriod.create({
      data: {
        name: payPeriodName,
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: 'open',
      },
    }));

  // Seed completed successfully
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
