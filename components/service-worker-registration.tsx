"use client"

import { useEffect } from 'react'
import { serviceWorkerManager } from '@/lib/serviceWorker'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerRegistration() {
  const { toast } = useToast()

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        const registration = await serviceWorkerManager.register()
        
        if (registration) {
          // Registration successful
        } else {
          // Registration skipped or failed gracefully
        }
      } catch (error) {
        // Service Worker registration failed - graceful degradation
        if (process.env.NODE_ENV === 'development') {
          console.warn('SW: Registration failed, app will continue without SW:', error)
        }
        // App continues to work normally without service worker
      }
    }

    // Conservative update handling - don't be aggressive about updates
    const handleSwUpdate = (event: CustomEvent) => {
      const { timestamp } = event.detail
      
      // Only show update notification if it's been a while since last check
      const lastUpdateCheck = localStorage.getItem('sw-last-update-check')
      const timeSinceLastCheck = timestamp - (parseInt(lastUpdateCheck || '0', 10))
      
      // Show update notification at most once per hour
      if (timeSinceLastCheck > 60 * 60 * 1000) {
        localStorage.setItem('sw-last-update-check', timestamp.toString())
        
        toast({
          title: 'App Update Available',
          description: 'A new version is available. Refresh when convenient.',
          duration: 10000, // Show for 10 seconds
          action: (
            <button
              onClick={() => {
                localStorage.removeItem('sw-last-update-check')
                window.location.reload()
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Refresh
            </button>
          ),
        })
      }
    }

    // Add event listener for service worker updates
    window.addEventListener('sw-update-available', handleSwUpdate as EventListener)

    // Conservative registration policy
    const shouldRegister = process.env.NODE_ENV === 'production' || 
                          process.env.NEXT_PUBLIC_SW_ENABLED === 'true'
    
    if (shouldRegister) {
      registerServiceWorker()
    }

    // Cleanup
    return () => {
      window.removeEventListener('sw-update-available', handleSwUpdate as EventListener)
    }
  }, [toast])

  return null
}