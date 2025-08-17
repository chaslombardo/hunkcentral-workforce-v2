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
          // Service Worker registered successfully
        }
      } catch (error) {
        // Service Worker registration failed - log in development, silent in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('Service Worker registration failed:', error)
        }
      }
    }

    // Listen for service worker update events
    const handleSwUpdate = () => {
      toast({
        title: 'App Update Available',
        description: 'A new version of HUNKCentral is available. Refresh to update.',
        action: (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Refresh
          </button>
        ),
      })
    }

    // Add event listener for service worker updates
    window.addEventListener('sw-update-available', handleSwUpdate)

    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SW_ENABLED === 'true') {
      registerServiceWorker()
    }

    // Cleanup
    return () => {
      window.removeEventListener('sw-update-available', handleSwUpdate)
    }
  }, [toast])

  return null
}