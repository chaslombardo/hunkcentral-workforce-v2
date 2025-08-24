/**
 * Production Environment Configuration
 * Centralized configuration for production deployment and monitoring
 */

export interface ProductionConfig {
  deployment: {
    environment: 'development' | 'preview' | 'production';
    region: string;
    version: string;
    buildId: string;
    deploymentUrl: string;
  };

  monitoring: {
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
    enableUptimeMonitoring: boolean;
    enableSecurityMonitoring: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
  };

  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableQueryLogging: boolean;
    enableSlowQueryLogging: boolean;
    slowQueryThreshold: number;
  };

  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    sessionTimeout: number;
  };

  performance: {
    enableCaching: boolean;
    cacheMaxAge: number;
    enableCompression: boolean;
    enableImageOptimization: boolean;
    maxRequestSize: number;
  };

  alerts: {
    enableSlackNotifications: boolean;
    enableEmailNotifications: boolean;
    slackWebhookUrl?: string;
    alertEmail?: string;
    errorThreshold: number;
    responseTimeThreshold: number;
  };
}

// Environment-specific configurations
const developmentConfig: ProductionConfig = {
  deployment: {
    environment: 'development',
    region: 'local',
    version: process.env.npm_package_version || '0.1.0',
    buildId: 'dev',
    deploymentUrl: 'http://localhost:3000',
  },

  monitoring: {
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    enableUptimeMonitoring: false,
    enableSecurityMonitoring: false,
    logLevel: 'debug',
    retentionDays: 7,
  },

  database: {
    connectionPoolSize: 5,
    queryTimeout: 10000,
    enableQueryLogging: true,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000,
  },

  security: {
    enableCSP: false,
    enableHSTS: false,
    enableRateLimiting: false,
    rateLimitRequests: 1000,
    rateLimitWindow: 60000,
    sessionTimeout: 86400000, // 24 hours
  },

  performance: {
    enableCaching: false,
    cacheMaxAge: 0,
    enableCompression: false,
    enableImageOptimization: true,
    maxRequestSize: 10485760, // 10MB
  },

  alerts: {
    enableSlackNotifications: false,
    enableEmailNotifications: false,
    errorThreshold: 10,
    responseTimeThreshold: 5000,
  },
};

const previewConfig: ProductionConfig = {
  deployment: {
    environment: 'preview',
    region: process.env.VERCEL_REGION || 'iad1',
    version: process.env.npm_package_version || '0.1.0',
    buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'preview',
    deploymentUrl: process.env.VERCEL_URL || 'preview.hunkcentral.com',
  },

  monitoring: {
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    enableUptimeMonitoring: true,
    enableSecurityMonitoring: true,
    logLevel: 'info',
    retentionDays: 14,
  },

  database: {
    connectionPoolSize: 10,
    queryTimeout: 15000,
    enableQueryLogging: false,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 2000,
  },

  security: {
    enableCSP: true,
    enableHSTS: true,
    enableRateLimiting: true,
    rateLimitRequests: 500,
    rateLimitWindow: 60000,
    sessionTimeout: 43200000, // 12 hours
  },

  performance: {
    enableCaching: true,
    cacheMaxAge: 3600, // 1 hour
    enableCompression: true,
    enableImageOptimization: true,
    maxRequestSize: 5242880, // 5MB
  },

  alerts: {
    enableSlackNotifications: false,
    enableEmailNotifications: true,
    alertEmail: process.env.ALERT_EMAIL,
    errorThreshold: 5,
    responseTimeThreshold: 3000,
  },
};

const productionConfig: ProductionConfig = {
  deployment: {
    environment: 'production',
    region: process.env.VERCEL_REGION || 'iad1',
    version: process.env.npm_package_version || '0.1.0',
    buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'production',
    deploymentUrl: process.env.VERCEL_URL || 'hunkcentral.com',
  },

  monitoring: {
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    enableUptimeMonitoring: true,
    enableSecurityMonitoring: true,
    logLevel: 'warn',
    retentionDays: 90,
  },

  database: {
    connectionPoolSize: 20,
    queryTimeout: 30000,
    enableQueryLogging: false,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 5000,
  },

  security: {
    enableCSP: true,
    enableHSTS: true,
    enableRateLimiting: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60000,
    sessionTimeout: 28800000, // 8 hours
  },

  performance: {
    enableCaching: true,
    cacheMaxAge: 86400, // 24 hours
    enableCompression: true,
    enableImageOptimization: true,
    maxRequestSize: 2097152, // 2MB
  },

  alerts: {
    enableSlackNotifications: true,
    enableEmailNotifications: true,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    alertEmail: process.env.ALERT_EMAIL,
    errorThreshold: 3,
    responseTimeThreshold: 2000,
  },
};

// Get current configuration based on environment
function getCurrentConfig(): ProductionConfig {
  const env = process.env.NODE_ENV;
  const isVercel = !!process.env.VERCEL;
  const isProduction = process.env.VERCEL_ENV === 'production';

  if (env === 'development' && !isVercel) {
    return developmentConfig;
  }

  if (isVercel && !isProduction) {
    return previewConfig;
  }

  return productionConfig;
}

export const config = getCurrentConfig();

// Helper functions
export function isProduction(): boolean {
  return config.deployment.environment === 'production';
}

export function isPreview(): boolean {
  return config.deployment.environment === 'preview';
}

export function isDevelopment(): boolean {
  return config.deployment.environment === 'development';
}

export function getLogLevel(): ProductionConfig['monitoring']['logLevel'] {
  return config.monitoring.logLevel;
}

export function shouldLogQuery(): boolean {
  return config.database.enableQueryLogging;
}

export function shouldLogSlowQuery(): boolean {
  return config.database.enableSlowQueryLogging;
}

export function getSlowQueryThreshold(): number {
  return config.database.slowQueryThreshold;
}

export function isMonitoringEnabled(
  type: keyof ProductionConfig['monitoring']
): boolean {
  return config.monitoring[type] as boolean;
}

export function getSecurityConfig(): ProductionConfig['security'] {
  return config.security;
}

export function getPerformanceConfig(): ProductionConfig['performance'] {
  return config.performance;
}

export function getAlertsConfig(): ProductionConfig['alerts'] {
  return config.alerts;
}

export function getDatabaseConfig(): ProductionConfig['database'] {
  return config.database;
}

export function getDeploymentInfo(): ProductionConfig['deployment'] {
  return config.deployment;
}

// Export for debugging in development
if (typeof window !== 'undefined' && isDevelopment()) {
  (window as unknown as Record<string, unknown>).__productionConfig = {
    config,
    isProduction,
    isPreview,
    isDevelopment,
    getLogLevel,
    shouldLogQuery,
    shouldLogSlowQuery,
    getSlowQueryThreshold,
    isMonitoringEnabled,
    getSecurityConfig,
    getPerformanceConfig,
    getAlertsConfig,
    getDatabaseConfig,
    getDeploymentInfo,
  };
}

export default config;
