"use client"

import { useNavigation } from '@/contexts/navigation-context'

/**
 * Hook to access navigation state and utilities
 * This is a convenience wrapper around the navigation context
 */
export function useNavigationState() {
  const navigation = useNavigation()
  
  return {
    // Current navigation state
    currentPath: navigation.state.currentPath,
    currentSection: navigation.state.currentSection,
    badges: navigation.state.badges,
    isLoading: navigation.state.isLoading,
    
    // Navigation utilities
    isActiveRoute: navigation.isActiveRoute,
    isActiveSection: navigation.isActiveSection,
    
    // Badge management
    updateBadge: navigation.updateBadge,
    refreshBadges: navigation.refreshBadges,
    
    // Helper functions
    getBadgeCount: (badgeId: string) => navigation.state.badges[badgeId]?.count || 0,
    getBadgeType: (badgeId: string) => navigation.state.badges[badgeId]?.type || 'pending',
    hasBadge: (badgeId: string) => !!navigation.state.badges[badgeId] && navigation.state.badges[badgeId].count > 0,
    
    // Total counts for dashboard/summary views
    getTotalPendingLogs: () => navigation.state.badges['logs-review']?.count || 0,
    getTotalDraftLogs: () => navigation.state.badges['logs-draft']?.count || 0,
    getTotalPendingCommissions: () => navigation.state.badges['commission-pending']?.count || 0,
    
    // Get all badges of a specific type
    getBadgesByType: (type: 'pending' | 'warning' | 'info') => 
      Object.values(navigation.state.badges).filter(badge => badge.type === type),
  }
}

/**
 * Hook to get navigation badge information for a specific route
 */
export function useNavigationBadge(route: string) {
  const { badges } = useNavigationState()
  
  // Map routes to badge IDs
  const routeToBadgeMap: Record<string, string> = {
    '/logs': 'logs-review',
    '/logs/review': 'logs-review',
    '/logs/create': 'logs-draft',
    '/commission': 'commission-pending',
    '/commission/list': 'commission-pending',
  }
  
  const badgeId = routeToBadgeMap[route]
  const badge = badgeId ? badges[badgeId] : null
  
  return {
    count: badge?.count || 0,
    type: badge?.type || 'pending',
    label: badge?.label || '',
    hasBadge: !!badge && badge.count > 0,
  }
}