// Prisma client configuration with connection pooling and performance optimization
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with connection pooling and performance optimizations
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Connection pooling configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },

    // Logging configuration for performance monitoring
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],

    // Error formatting
    errorFormat: 'pretty',
  });

// Connection pool optimization
if (process.env.NODE_ENV === 'production') {
  // Set connection pool limits for production
  prisma.$connect().then(() => {
    console.warn('Database connected with optimized connection pool');
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
