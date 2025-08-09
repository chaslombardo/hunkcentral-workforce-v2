"use client"

import * as React from "react"
import { screenReaderUtils } from "@/lib/accessibility-utils"

interface AccessibilityAnnouncerProps {
  children: React.ReactNode
}

/**
 * AccessibilityAnnouncer provides a centralized way to manage screen reader announcements
 * and live regions throughout the application.
 */
export function AccessibilityAnnouncer({ children }: AccessibilityAnnouncerProps) {
  React.useEffect(() => {
    // Create global live regions on mount
    screenReaderUtils.createLiveRegion('global-announcer-polite', 'polite');
    screenReaderUtils.createLiveRegion('global-announcer-assertive', 'assertive');
    
    // Cleanup on unmount
    return () => {
      const politeRegion = document.getElementById('global-announcer-polite');
      const assertiveRegion = document.getElementById('global-announcer-assertive');
      
      if (politeRegion) {
        document.body.removeChild(politeRegion);
      }
      if (assertiveRegion) {
        document.body.removeChild(assertiveRegion);
      }
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook to announce messages to screen readers using global live regions
 */
export function useAnnouncer() {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const regionId = priority === 'assertive' ? 'global-announcer-assertive' : 'global-announcer-polite';
    screenReaderUtils.updateLiveRegion(regionId, message);
    
    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => {
      screenReaderUtils.updateLiveRegion(regionId, '');
    }, 1000);
  }, []);

  return { announce };
}

/**
 * Component for announcing route changes to screen readers
 */
export function RouteAnnouncer({ pathname }: { pathname: string }) {
  const { announce } = useAnnouncer();
  const previousPathname = React.useRef<string>('');

  React.useEffect(() => {
    if (previousPathname.current && previousPathname.current !== pathname) {
      // Extract page title from pathname
      const segments = pathname.split('/').filter(Boolean);
      const pageTitle = segments.length > 0 
        ? segments[segments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Dashboard';
      
      announce(`Navigated to ${pageTitle}`, 'polite');
    }
    previousPathname.current = pathname;
  }, [pathname, announce]);

  return null;
}

/**
 * Component for announcing form validation results
 */
export function FormValidationAnnouncer({ 
  errors, 
  isValid, 
  isSubmitting 
}: { 
  errors: string[]; 
  isValid: boolean; 
  isSubmitting: boolean; 
}) {
  const { announce } = useAnnouncer();
  const previousErrorCount = React.useRef<number>(0);
  const previousSubmitting = React.useRef<boolean>(false);

  React.useEffect(() => {
    // Announce validation errors
    if (errors.length > 0 && errors.length !== previousErrorCount.current) {
      const message = errors.length === 1 
        ? `Form has 1 error: ${errors[0]}`
        : `Form has ${errors.length} errors. First error: ${errors[0]}`;
      announce(message, 'assertive');
    }
    
    // Announce when form becomes valid
    if (isValid && previousErrorCount.current > 0 && errors.length === 0) {
      announce('Form is now valid', 'polite');
    }
    
    previousErrorCount.current = errors.length;
  }, [errors, isValid, announce]);

  React.useEffect(() => {
    // Announce submission state changes
    if (isSubmitting && !previousSubmitting.current) {
      announce('Form is being submitted', 'polite');
    } else if (!isSubmitting && previousSubmitting.current) {
      announce('Form submission completed', 'polite');
    }
    
    previousSubmitting.current = isSubmitting;
  }, [isSubmitting, announce]);

  return null;
}

/**
 * Component for announcing loading state changes
 */
export function LoadingAnnouncer({ 
  isLoading, 
  loadingMessage = 'Loading', 
  completedMessage = 'Loading completed' 
}: { 
  isLoading: boolean; 
  loadingMessage?: string; 
  completedMessage?: string; 
}) {
  const { announce } = useAnnouncer();
  const previousLoading = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (isLoading && !previousLoading.current) {
      announce(loadingMessage, 'polite');
    } else if (!isLoading && previousLoading.current) {
      announce(completedMessage, 'polite');
    }
    
    previousLoading.current = isLoading;
  }, [isLoading, loadingMessage, completedMessage, announce]);

  return null;
}