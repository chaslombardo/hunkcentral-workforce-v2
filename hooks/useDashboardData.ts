"use client"

import { useState, useEffect, useCallback } from 'react'
import { getDashboardMetrics, getRoleSpecificMetrics, type DashboardMetrics, type RoleSpecificMetrics } from '@/lib/actions/dashboard'

interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null
  roleMetrics: RoleSpecificMetrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardData(userRoles?: string[]): UseDashboardDataReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [roleMetrics, setRoleMetrics] = useState<RoleSpecificMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch general metrics
      const metricsResult = await getDashboardMetrics()
      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data)
      } else {
        throw new Error(metricsResult.error || 'Failed to load dashboard metrics')
      }

      // Fetch role-specific metrics if roles are provided
      if (userRoles && userRoles.length > 0) {
        const roleResult = await getRoleSpecificMetrics(userRoles)
        if (roleResult.success && roleResult.data) {
          setRoleMetrics(roleResult.data)
        } else {
          // Don't throw error for role metrics, just log it
          console.warn('Failed to load role-specific metrics:', roleResult.error)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [userRoles])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    metrics,
    roleMetrics,
    loading,
    error,
    refetch: fetchDashboardData
  }
}