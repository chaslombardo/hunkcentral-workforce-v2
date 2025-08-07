"use client"

import { useEffect } from 'react'
import { usePerformance } from '@/hooks/usePerformance'
import { useToast } from '@/hooks/use-toast'

export function PerformanceMonitor() {
  const { metrics, isSlowConnection, getPerformanceScore, measurePageLoad } = usePerformance()
  const { toast } = useToast()

  useEffect(() => {
    // Monitor page load performance
    const endMeasurement = measurePageLoad('app-load')
    
    return () => {
      const loadTime = endMeasurement()
      
      // Warn about slow page loads
      if (loadTime > 3000) {
        // Slow page load detected
        
        // Only show toast in development
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: 'Performance Warning',
            description: `Page loaded in ${(loadTime / 1000).toFixed(1)}s. Consider optimizing.`,
            variant: 'destructive',
          })
        }
      }
    }
  }, [measurePageLoad, toast])

  useEffect(() => {
    // Monitor overall performance score
    const score = getPerformanceScore()
    
    if (score < 60) {
      // Poor performance score detected
    }
  }, [metrics, getPerformanceScore])

  useEffect(() => {
    // Monitor slow connections for potential optimizations
    if (isSlowConnection) {
      // Could trigger optimized content loading here
    }
  }, [isSlowConnection])

  // Performance monitoring runs in the background
  return null
}

// Hook for measuring specific operations
export function useOperationPerformance() {
  const { measureApiCall } = usePerformance()

  const measureOperation = (operationName: string) => {
    const startTime = performance.now()
    
    return {
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Log slow operations
        if (duration > 1000) {
          // Slow operation detected
        }
        
        return duration
      }
    }
  }

  return {
    measureOperation,
    measureApiCall,
  }
}