'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardMetrics,
  getRoleSpecificMetrics,
  type DashboardMetrics,
  type RoleSpecificMetrics,
} from '@/lib/actions/dashboard';

interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null;
  roleMetrics: RoleSpecificMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(userRoles?: string[]): UseDashboardDataReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [roleMetrics, setRoleMetrics] = useState<RoleSpecificMetrics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metrics in parallel to avoid waterfall effect
      const [metricsResult, roleResult] = await Promise.allSettled([
        getDashboardMetrics(),
        userRoles && userRoles.length > 0
          ? getRoleSpecificMetrics(userRoles)
          : Promise.resolve({ success: true, data: null }),
      ]);

      // Handle general metrics
      if (metricsResult.status === 'fulfilled' && metricsResult.value.success) {
        setMetrics(metricsResult.value.data);
      } else {
        const error =
          metricsResult.status === 'rejected'
            ? metricsResult.reason
            : metricsResult.value.error;
        throw new Error(error || 'Failed to load dashboard metrics');
      }

      // Handle role-specific metrics
      if (
        roleResult.status === 'fulfilled' &&
        roleResult.value?.success &&
        roleResult.value.data
      ) {
        setRoleMetrics(roleResult.value.data);
      } else if (roleResult.status === 'rejected' || roleResult.value?.error) {
        // Don't throw for role metrics, just log it
        console.warn(
          'Failed to load role-specific metrics:',
          roleResult.status === 'rejected'
            ? roleResult.reason
            : roleResult.value?.error
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, [userRoles]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    metrics,
    roleMetrics,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
