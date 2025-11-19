/**
 * Server-only health checks to avoid bundling Node.js modules in client code
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: string;
  details?: Record<string, unknown>;
  error?: string;
}

/**
 * File system health check - server only
 */
export async function checkFileSystem(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Check if we can write to temp directory
    const tempFile = path.join(process.cwd(), '.tmp-health-check');
    await fs.writeFile(tempFile, 'health-check');
    await fs.unlink(tempFile);

    // Check critical files exist
    const criticalFiles = [
      'prisma/schema.prisma',
      'lib/auth-config.ts',
      'lib/payCalculator.ts',
      'lib/validations.ts',
    ];

    const missingFiles: string[] = [];
    for (const file of criticalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        name: 'filesystem',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: `Missing critical files: ${missingFiles.join(', ')}`,
      };
    }

    const responseTime = Date.now() - startTime;

    return {
      name: 'filesystem',
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        writeAccess: true,
        workingDirectory: process.cwd(),
        criticalFilesChecked: criticalFiles.length,
      },
    };
  } catch (error) {
    return {
      name: 'filesystem',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Database health check
 */
export async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Import Prisma client dynamically to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');

    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return {
      name: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        connectionPool: 'active',
        queryTime: responseTime,
      },
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Memory usage health check
 */
export async function checkMemoryUsage(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();
    const memoryPercentage =
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    let status: HealthCheck['status'] = 'healthy';
    if (memoryPercentage > 90) {
      status = 'unhealthy';
    } else if (memoryPercentage > 75) {
      status = 'degraded';
    }

    const responseTime = Date.now() - startTime;

    return {
      name: 'memory',
      status,
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        percentage: memoryPercentage,
        external: memoryUsage.external,
      },
    };
  } catch (error) {
    return {
      name: 'memory',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
