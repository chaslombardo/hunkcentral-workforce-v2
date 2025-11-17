import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(
    'Database connected successfully. No seed data created for production.'
  );

  // Create initial pay period if needed
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

  if (!existingPayPeriod) {
    await prisma.payPeriod.create({
      data: {
        name: payPeriodName,
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: 'open',
      },
    });
    console.log(`Created pay period: ${payPeriodName}`);
  } else {
    console.log(`Pay period already exists: ${payPeriodName}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
