'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandling, setupErrorRetry } from '@/lib/client-error-logger';

/**
 * Production Error Monitor Component
 * Sets up global error handling and retry mechanisms for client-side errors
 */
export function ProductionErrorMonitor() {
  useEffect(() => {
    // Set up global error handling for unhandled errors and promise rejections
    setupGlobalErrorHandling();
    
    // Set up automatic retry mechanism for pending errors
    setupErrorRetry();
  }, []);

  // This component doesn't render anything
  return null;
}