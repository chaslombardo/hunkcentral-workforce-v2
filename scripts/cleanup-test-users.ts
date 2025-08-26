import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestUsers() {
  try {
    console.log('🧹 Starting cleanup of test users...');

    // Patterns to identify test users
    const testPatterns = [
      '%payroll-sales-%@test.com',
      '%payroll-captain-%@test.com',
      '%payroll-wingman-%@test.com',
      '%payroll-salary-%@test.com',
      '%payroll-manager-%@test.com',
      '%@test.com%',
      'payroll-sales-%',
      'payroll-captain-%',
      'payroll-wingman-%',
      'payroll-salary-%',
      'payroll-manager-%',
    ];

    // Find all test users first
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          ...testPatterns.map((pattern) => ({
            email: { contains: pattern.replace('%', '') },
          })),
          {
            fullName: { contains: 'Payroll' },
          },
          {
            email: { endsWith: '@test.com' },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    console.log(`Found ${testUsers.length} test users to clean up:`);
    testUsers.forEach((user) => {
      console.log(
        `  - ${user.fullName} (${user.email}) - Created: ${user.createdAt.toISOString()}`
      );
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found to clean up');
      return;
    }

    const testUserIds = testUsers.map((user) => user.id);

    // Clean up related data first (to avoid foreign key constraints)
    console.log('🗑️ Cleaning up related data...');

    // Delete audit logs
    const auditLogsDeleted = await prisma.auditLog.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`  Deleted ${auditLogsDeleted.count} audit log entries`);

    // Delete commission entries
    const commissionsDeleted = await prisma.commissionEntry.deleteMany({
      where: { salesId: { in: testUserIds } },
    });
    console.log(`  Deleted ${commissionsDeleted.count} commission entries`);

    // Delete log hours
    const logHoursDeleted = await prisma.logHour.deleteMany({
      where: { employeeId: { in: testUserIds } },
    });
    console.log(`  Deleted ${logHoursDeleted.count} log hour entries`);

    // Delete daily logs where user is captain
    const dailyLogsDeleted = await prisma.dailyLog.deleteMany({
      where: { captainId: { in: testUserIds } },
    });
    console.log(`  Deleted ${dailyLogsDeleted.count} daily log entries`);

    // Clean up any orphaned log jobs (these shouldn't have foreign key constraints to users)
    // But let's be safe and clean them if they reference test data
    const logJobsDeleted = await prisma.logJob.deleteMany({
      where: {
        log: {
          captainId: { in: testUserIds },
        },
      },
    });
    console.log(`  Deleted ${logJobsDeleted.count} log job entries`);

    // Finally, delete the test users
    const usersDeleted = await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
    console.log(`  Deleted ${usersDeleted.count} test users`);

    console.log('✅ Test user cleanup completed successfully!');
    console.log(`Total users cleaned up: ${usersDeleted.count}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupTestUsers()
  .then(() => {
    console.log('🎉 Cleanup script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
