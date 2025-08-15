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
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
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
              })
            }
          })
        }
      } catch (error) {
        // Service Worker registration failed - silently handle in production
      }
    }

    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SW_ENABLED === 'true') {
      registerServiceWorker()
    }
  }, [toast])

  return null
}