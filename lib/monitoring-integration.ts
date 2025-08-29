/**
 * Monitoring Integration Service
 * Connects monitoring services for system health metrics
 */

import { config, isMonitoringEnabled } from '@/lib/production-config';
import { logInfo, logWarning } from '@/lib/production-logger';

export interface MonitoringService {
  name: string;
  enabled: boolean;
  healthCheck(): Promise<boolean>;
  getMetrics(): Promise<Record<string, unknown>>;
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
  metrics: Record<string, unknown>;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

class MonitoringIntegration {
  private services: Map<string, MonitoringService> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck?: SystemHealthData;

  constructor() {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices(): void {
    // Database monitoring service
    this.registerService({
      name: 'database',
      enabled: isMonitoringEnabled('enablePerformanceMonitoring'),
      healthCheck: async () => {
        try {
          const { prisma } = await import('@/lib/prisma');
          await prisma.$queryRaw`SELECT 1`;
          return true;
        } catch (error) {
          console.error('Database health check failed:', error);
          return false;
        }
      },
      getMetrics: async () => {
        try {
          const { prisma } = await import('@/lib/prisma');

          // Get basic database metrics
          const userCount = await prisma.user.count();
          const logCount = await prisma.dailyLog.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          });
          const feedbackCount = await prisma.userFeedback.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          });

          return {
            totalUsers: userCount,
            dailyLogsLast24h: logCount,
            feedbackLast24h: feedbackCount,
            connectionStatus: 'connected',
          };
        } catch (error) {
          return {
            connectionStatus: 'error',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    });

    // Application monitoring service
    this.registerService({
      name: 'application',
      enabled: isMonitoringEnabled('enablePerformanceMonitoring'),
      healthCheck: async () => {
        try {
          // Check memory usage
          const memoryUsage = process.memoryUsage();
          const memoryPercentage =
            (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

          // Consider unhealthy if memory usage > 90%
          return memoryPercentage < 90;
        } catch {
          return false;
        }
      },
      getMetrics: async () => {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
          memory: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
            external: memoryUsage.external,
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
            total: cpuUsage.user + cpuUsage.system,
          },
          uptime: process.uptime(),
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
        };
      },
    });

    // External services monitoring
    this.registerService({
      name: 'external_services',
      enabled: isMonitoringEnabled('enableUptimeMonitoring'),
      healthCheck: async () => {
        try {
          // Check Supabase if configured
          if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
              {
                method: 'HEAD',
                headers: {
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                },
                signal: AbortSignal.timeout(5000), // 5 second timeout
              }
            );
            return response.ok;
          }
          return true; // No external services to check
        } catch {
          return false;
        }
      },
      getMetrics: async () => {
        const metrics: Record<string, unknown> = {};

        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          try {
            const startTime = Date.now();
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
              {
                method: 'HEAD',
                headers: {
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                },
                signal: AbortSignal.timeout(5000),
              }
            );
            const responseTime = Date.now() - startTime;

            metrics.supabase = {
              status: response.ok ? 'healthy' : 'unhealthy',
              responseTime,
              statusCode: response.status,
            };
          } catch (error) {
            metrics.supabase = {
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }

        return metrics;
      },
    });

    logInfo('Monitoring services initialized', {
      component: 'monitoring-integration',
      action: 'initialize',
      metadata: {
        serviceCount: this.services.size,
        enabledServices: Array.from(this.services.values())
          .filter((s) => s.enabled)
          .map((s) => s.name),
      },
    });
  }

  private startHealthChecks(): void {
    if (!isMonitoringEnabled('enablePerformanceMonitoring')) {
      return;
    }

    // Run health checks every 60 seconds
    this.healthCheckInterval = setInterval(() => {
      this.runHealthCheck();
    }, 60000);

    // Run initial health check
    this.runHealthCheck();
  }

  private async runHealthCheck(): Promise<void> {
    try {
      const services: Record<string, boolean> = {};
      const metrics: Record<string, unknown> = {};

      // Check all enabled services
      for (const [name, service] of this.services) {
        if (service.enabled) {
          try {
            services[name] = await service.healthCheck();
            metrics[name] = await service.getMetrics();
          } catch (error) {
            services[name] = false;
            metrics[name] = {
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }
      }

      // Determine overall status
      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;

      let status: SystemHealthData['status'] = 'healthy';
      if (healthyServices === 0) {
        status = 'unhealthy';
      } else if (healthyServices < totalServices) {
        status = 'degraded';
      }

      this.lastHealthCheck = {
        status,
        services,
        metrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: config.deployment.version,
        environment: config.deployment.environment,
      };

      // Log health check results
      if (status !== 'healthy') {
        logWarning(`System health check: ${status}`, {
          component: 'monitoring-integration',
          action: 'health_check',
          metadata: {
            status,
            healthyServices,
            totalServices,
            failedServices: Object.entries(services)
              .filter(([, healthy]) => !healthy)
              .map(([name]) => name),
          },
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  public registerService(service: MonitoringService): void {
    this.services.set(service.name, service);

    logInfo(`Monitoring service registered: ${service.name}`, {
      component: 'monitoring-integration',
      action: 'register_service',
      metadata: {
        serviceName: service.name,
        enabled: service.enabled,
      },
    });
  }

  public getSystemHealth(): SystemHealthData | null {
    return this.lastHealthCheck || null;
  }

  public async getServiceMetrics(
    serviceName?: string
  ): Promise<Record<string, unknown>> {
    if (serviceName) {
      const service = this.services.get(serviceName);
      if (service && service.enabled) {
        try {
          return await service.getMetrics();
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      return {};
    }

    // Get metrics from all enabled services
    const allMetrics: Record<string, unknown> = {};
    for (const [name, service] of this.services) {
      if (service.enabled) {
        try {
          allMetrics[name] = await service.getMetrics();
        } catch (error) {
          allMetrics[name] = {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    }

    return allMetrics;
  }

  public getEnabledServices(): string[] {
    return Array.from(this.services.values())
      .filter((service) => service.enabled)
      .map((service) => service.name);
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    logInfo('Monitoring integration destroyed', {
      component: 'monitoring-integration',
      action: 'destroy',
    });
  }
}

// Singleton instance
let monitoringIntegration: MonitoringIntegration | null = null;

export function getMonitoringIntegration(): MonitoringIntegration {
  if (!monitoringIntegration) {
    monitoringIntegration = new MonitoringIntegration();
  }
  return monitoringIntegration;
}

export function destroyMonitoringIntegration(): void {
  if (monitoringIntegration) {
    monitoringIntegration.destroy();
    monitoringIntegration = null;
  }
}

// Initialize monitoring integration on server startup
if (
  typeof window === 'undefined' &&
  isMonitoringEnabled('enablePerformanceMonitoring')
) {
  getMonitoringIntegration();
}
