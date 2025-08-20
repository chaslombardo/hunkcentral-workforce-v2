import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@hunkcentral.com',
        password: hashedPassword,
        fullName: 'Test Admin',
        roles: ['admin', 'manager', 'captain', 'sales'],
        // Set some default rates
        rateJunkCaptain: 20.0,
        rateJunkWingman: 15.0,
        rateMoveCaptain: 22.0,
        rateMoveWingman: 17.0,
        rateZigma: 18.0,
        rateTraining: 16.0,
        rateEstimating: 19.0,
        rateWarehouse: 14.0,
        rateAdmin: 20.0,
        commissionRate: 0.05,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      },
    });

    // eslint-disable-next-line no-console
    console.log('✅ Test user created successfully!');
    // eslint-disable-next-line no-console
    console.log('Email: admin@hunkcentral.com');
    // eslint-disable-next-line no-console
    console.log('Password: password123');
    // eslint-disable-next-line no-console
    console.log('User ID:', user.id);

    // Create a test captain user too
    const captain = await prisma.user.create({
      data: {
        email: 'captain@hunkcentral.com',
        password: hashedPassword,
        fullName: 'Test Captain',
        roles: ['captain'],
        rateJunkCaptain: 20.0,
        rateJunkWingman: 15.0,
        rateMoveCaptain: 22.0,
        rateMoveWingman: 17.0,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      },
    });

    // eslint-disable-next-line no-console
    console.log('✅ Test captain created successfully!');
    // eslint-disable-next-line no-console
    console.log('Email: captain@hunkcentral.com');
    // eslint-disable-next-line no-console
    console.log('Password: password123');
    // eslint-disable-next-line no-console
    console.log('Captain ID:', captain.id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
