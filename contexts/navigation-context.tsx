"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

interface NavigationBadge {
  id: string
  count: number
  type: 'pending' | 'warning' | 'info'
  label: string
}

interface NavigationState {
  currentPath: string
  currentSection: string
  badges: Record<string, NavigationBadge>
  isLoading: boolean
}

interface NavigationContextType {
  state: NavigationState
  updateBadge: (id: string, badge: NavigationBadge | null) => void
  refreshBadges: () => Promise<void>
  isActiveRoute: (route: string) => boolean
  isActiveSection: (section: string) => boolean
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

interface NavigationProviderProps {
  children: React.ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname()
  const { user, hasAnyRole } = useSession()
  
  const [state, setState] = useState<NavigationState>({
    currentPath: pathname,
    currentSection: getCurrentSection(pathname),
    badges: {},
    isLoading: false,
  })

  // Update current path and section when pathname changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentPath: pathname,
      currentSection: getCurrentSection(pathname),
    }))
  }, [pathname])

  // Refresh badges when user changes or on mount
  useEffect(() => {
    if (user) {
      refreshBadges()
    }
  }, [user])

  // Auto-refresh badges every 30 seconds for real-time updates
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      refreshBadges()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const updateBadge = (id: string, badge: NavigationBadge | null) => {
    setState(prev => {
      const newBadges = { ...prev.badges }
      if (badge === null) {
        delete newBadges[id]
      } else {
        newBadges[id] = badge
      }
      return {
        ...prev,
        badges: newBadges,
      }
    })
  }

  const refreshBadges = async () => {
    if (!user) return

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const badges: Record<string, NavigationBadge> = {}

      // Get pending logs count for managers/admins
      if (hasAnyRole(['manager', 'admin'])) {
        try {
          const response = await fetch('/api/navigation/pending-logs')
          if (response.ok) {
            const data = await response.json()
            if (data.count > 0) {
              badges['logs-review'] = {
                id: 'logs-review',
                count: data.count,
                type: 'pending',
                label: `${data.count} log${data.count === 1 ? '' : 's'} awaiting review`,
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch pending logs count:', error)
        }
      }

      // Get pending commission entries for sales/admins
      if (hasAnyRole(['sales', 'admin'])) {
        try {
          const response = await fetch('/api/navigation/pending-commissions')
          if (response.ok) {
            const data = await response.json()
            if (data.count > 0) {
              badges['commission-pending'] = {
                id: 'commission-pending',
                count: data.count,
                type: 'info',
                label: `${data.count} commission${data.count === 1 ? '' : 's'} pending`,
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch pending commissions count:', error)
        }
      }

      // Get draft logs count for captains
      if (hasAnyRole(['captain', 'admin'])) {
        try {
          const response = await fetch('/api/navigation/draft-logs')
          if (response.ok) {
            const data = await response.json()
            if (data.count > 0) {
              badges['logs-draft'] = {
                id: 'logs-draft',
                count: data.count,
                type: 'warning',
                label: `${data.count} draft log${data.count === 1 ? '' : 's'}`,
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch draft logs count:', error)
        }
      }

      setState(prev => ({
        ...prev,
        badges,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to refresh navigation badges:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const isActiveRoute = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === route || pathname.startsWith(route + '/')
  }

  const isActiveSection = (section: string) => {
    return state.currentSection === section
  }

  const contextValue: NavigationContextType = {
    state,
    updateBadge,
    refreshBadges,
    isActiveRoute,
    isActiveSection,
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}

// Helper function to determine current section from pathname
function getCurrentSection(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/logs')) return 'logs'
  if (pathname.startsWith('/commission')) return 'commission'
  if (pathname.startsWith('/reports')) return 'reports'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'other'
}