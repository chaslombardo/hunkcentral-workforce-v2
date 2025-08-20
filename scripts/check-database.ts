import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // eslint-disable-next-line no-console
    console.log('🔍 Checking database connection...');

    // Test basic connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connection successful');

    // Check if tables exist and have data
    const userCount = await prisma.user.count();
    // eslint-disable-next-line no-console
    console.log(`👥 Users in database: ${userCount}`);

    const logCount = await prisma.dailyLog.count();
    // eslint-disable-next-line no-console
    console.log(`📋 Daily logs in database: ${logCount}`);

    const commissionCount = await prisma.commissionEntry.count();
    // eslint-disable-next-line no-console
    console.log(`💰 Commission entries in database: ${commissionCount}`);

    // List all users
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
          createdAt: true,
        },
      });
      // eslint-disable-next-line no-console
      console.log('\n👤 Users:');
      users.forEach((user) => {
        // eslint-disable-next-line no-console
        console.log(
          `  - ${user.fullName} (${user.email}) - Roles: ${user.roles.join(', ')}`
        );
      });
    }

    // eslint-disable-next-line no-console
    console.log('\n✅ Database check completed successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
