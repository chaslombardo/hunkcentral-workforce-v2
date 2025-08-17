"use client"

import { useEffect } from 'react'
import { serviceWorkerManager } from '@/lib/serviceWorker'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerRegistration() {
  const { toast } = useToast()

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        // Track user activity for session protection
        const trackUserActivity = () => {
          localStorage.setItem('last-user-activity', Date.now().toString())
        }
        
        // Track various user interactions
        const events = ['click', 'keydown', 'scroll', 'touchstart']
        events.forEach(event => {
          document.addEventListener(event, trackUserActivity, { passive: true })
        })

        const registration = await serviceWorkerManager.register()
        
        if (registration) {
          // Registration successful - set up additional monitoring
          setupRegistrationMonitoring(registration)
        } else {
          // Registration skipped or failed gracefully
          handleRegistrationSkipped()
        }
      } catch (error) {
        // Service Worker registration failed - graceful degradation
        handleRegistrationError(error)
      }
    }

    const setupRegistrationMonitoring = (registration: ServiceWorkerRegistration) => {
      // Monitor registration state changes
      const checkRegistrationHealth = () => {
        if (!registration.active && !registration.waiting && !registration.installing) {
          // Registration is in a bad state - attempt recovery
          setTimeout(() => {
            serviceWorkerManager.register().catch(() => {
              // Ignore recovery failures
            })
          }, 5000)
        }
      }

      // Check health periodically
      const healthCheckInterval = setInterval(checkRegistrationHealth, 300000) // 5 minutes

      // Clean up on unmount
      return () => {
        clearInterval(healthCheckInterval)
      }
    }

    const handleRegistrationSkipped = () => {
      // Registration was skipped - this is normal in development or when disabled
      if (process.env.NODE_ENV === 'development') {
        // Optionally show a development notice
      }
    }

    const handleRegistrationError = (error: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('SW: Registration failed, app will continue without SW:', error)
      }
      
      // In production, silently continue - the app works fine without SW
      // Optionally report to error tracking service
    }

    // Enhanced update handling with session protection
    const handleSwUpdate = (event: CustomEvent) => {
      const { timestamp } = event.detail
      
      // Check if user has active session or unsaved work
      const hasActiveSession = checkForActiveUserSession()
      const lastUpdateCheck = localStorage.getItem('sw-last-update-check')
      const timeSinceLastCheck = timestamp - (parseInt(lastUpdateCheck || '0', 10))
      
      // More conservative update notifications for active sessions
      const minTimeBetweenNotifications = hasActiveSession ? 
        2 * 60 * 60 * 1000 : // 2 hours for active sessions
        60 * 60 * 1000       // 1 hour for inactive sessions
      
      if (timeSinceLastCheck > minTimeBetweenNotifications) {
        localStorage.setItem('sw-last-update-check', timestamp.toString())
        
        const updateMessage = hasActiveSession ?
          'A new version is available. Update when you finish your current work.' :
          'A new version is available. Refresh when convenient.'
        
        toast({
          title: 'App Update Available',
          description: updateMessage,
          duration: hasActiveSession ? 15000 : 10000, // Longer duration for active sessions
          action: (
            <button
              onClick={() => {
                // Set flag for controlled refresh
                localStorage.setItem('user-consented-refresh', 'true')
                localStorage.removeItem('sw-last-update-check')
                
                // Give user a moment to save work if needed
                if (hasActiveSession) {
                  toast({
                    title: 'Refreshing...',
                    description: 'Please save any unsaved work.',
                    duration: 3000,
                  })
                  setTimeout(() => {
                    window.location.reload()
                  }, 3000)
                } else {
                  window.location.reload()
                }
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {hasActiveSession ? 'Update Soon' : 'Refresh'}
            </button>
          ),
        })
      }
    }

    const checkForActiveUserSession = (): boolean => {
      try {
        // Check for authentication
        const hasAuth = localStorage.getItem('auth-token') || 
                       sessionStorage.getItem('auth-token') ||
                       document.cookie.includes('next-auth')
        
        // Check for unsaved work
        const hasUnsavedWork = localStorage.getItem('draft-log') ||
                              localStorage.getItem('unsaved-form-data') ||
                              document.querySelector('form[data-dirty="true"]')
        
        // Check for recent activity
        const lastActivity = parseInt(localStorage.getItem('last-user-activity') || '0', 10)
        const recentActivity = Date.now() - lastActivity < 60000 // 1 minute
        
        return !!(hasAuth || hasUnsavedWork || recentActivity)
      } catch {
        return true // Assume active session if we can't check
      }
    }

    // Add event listener for service worker updates
    window.addEventListener('sw-update-available', handleSwUpdate as EventListener)

    // Environment-based registration policy with enhanced safety
    const shouldRegister = () => {
      // Check if explicitly disabled
      if (process.env.NEXT_PUBLIC_SW_DISABLED === 'true') {
        return false
      }
      
      // Check environment
      const isProduction = process.env.NODE_ENV === 'production'
      const isDevelopment = process.env.NODE_ENV === 'development'
      const swEnabled = process.env.NEXT_PUBLIC_SW_ENABLED === 'true'
      
      // Production: register by default unless disabled
      if (isProduction) {
        return true
      }
      
      // Development: only register if explicitly enabled
      if (isDevelopment) {
        return swEnabled
      }
      
      // Unknown environment: don't register
      return false
    }
    
    if (shouldRegister()) {
      registerServiceWorker()
    }

    // Cleanup
    return () => {
      window.removeEventListener('sw-update-available', handleSwUpdate as EventListener)
    }
  }, [toast])

  return null
}