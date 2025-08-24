/**
 * Monitoring Types
 * Shared types for monitoring system - client-safe
 */

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    avgResponseTime: number;
  };
  http: {
    requestsPerMinute: number;
    avgResponseTime: number;
    errorRate: number;
  };
  errors: {
    count: number;
    criticalCount: number;
    lastError?: string;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'performance' | 'security' | 'uptime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata: Record<string, unknown>;
}
