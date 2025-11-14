'use client';

import { useEffect } from 'react';
import { serviceWorkerManager } from '@/lib/serviceWorker';
import { useToast } from '@/hooks/use-toast';

export function ServiceWorkerRegistration() {
  const { toast } = useToast();

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        // Enhanced user activity tracking for session protection
        const trackUserActivity = () => {
          const timestamp = Date.now().toString();
          localStorage.setItem('last-user-activity', timestamp);
          sessionStorage.setItem('user-active', 'true');
        };

        // Track comprehensive user interactions
        const events = [
          'click',
          'keydown',
          'scroll',
          'touchstart',
          'mousemove',
          'focus',
          'blur',
        ];
        events.forEach((event) => {
          document.addEventListener(event, trackUserActivity, {
            passive: true,
          });
        });

        // Initial activity tracking
        trackUserActivity();

        // Production-ready registration with enhanced error handling
        const registration = await serviceWorkerManager.register();

        if (registration) {
          // Registration successful - set up comprehensive monitoring
          setupRegistrationMonitoring(registration);

          // Registration successful - no logging in production
        } else {
          // Registration skipped or failed gracefully - this is normal
          handleRegistrationSkipped();
        }
      } catch (error) {
        // Service Worker registration failed - implement graceful degradation
        handleRegistrationError(error);
      }
    };

    const setupRegistrationMonitoring = (
      registration: ServiceWorkerRegistration
    ) => {
      // Enhanced registration health monitoring
      const checkRegistrationHealth = () => {
        try {
          // Check if registration is in a problematic state
          if (
            !registration.active &&
            !registration.waiting &&
            !registration.installing
          ) {
            // Registration is in a bad state - attempt conservative recovery
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                'SW: Registration in bad state, attempting recovery'
              );
            }

            // Delay recovery to avoid rapid retry loops
            setTimeout(() => {
              serviceWorkerManager.register().catch((recoveryError) => {
                // Log recovery failure in development only
                if (process.env.NODE_ENV === 'development') {
                  console.warn('SW: Recovery attempt failed:', recoveryError);
                }
              });
            }, 10000); // Increased delay for production stability
          }

          // Check for service worker errors
          if (registration.active?.state === 'redundant') {
            // Service worker became redundant - this might indicate an issue
            if (process.env.NODE_ENV === 'development') {
              console.warn('SW: Service worker became redundant');
            }
          }
        } catch (monitoringError) {
          // Monitoring itself failed - log in development only
          if (process.env.NODE_ENV === 'development') {
            console.warn('SW: Health monitoring error:', monitoringError);
          }
        }
      };

      // Conservative health check interval - less frequent for production stability
      const healthCheckInterval = setInterval(checkRegistrationHealth, 600000); // 10 minutes

      // Enhanced cleanup function
      return () => {
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
      };
    };

    const handleRegistrationSkipped = () => {
      // Registration was skipped - this is normal and expected behavior
      // Registration was skipped - log only in development
      if (process.env.NODE_ENV === 'development') {
        const reason =
          process.env.NEXT_PUBLIC_SW_DISABLED === 'true'
            ? 'disabled'
            : process.env.NEXT_PUBLIC_SW_ENABLED !== 'true'
              ? 'not enabled for development'
              : 'environment or capability check failed';
        console.warn(`SW: Registration skipped (${reason})`);
      }

      // Set flag to indicate app is running without service worker
      sessionStorage.setItem('sw-status', 'skipped');
    };

    const handleRegistrationError = (error: unknown) => {
      // Enhanced error handling with categorization
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorType = categorizeRegistrationError(error);

      if (process.env.NODE_ENV === 'development') {
        console.warn(`SW: Registration failed (${errorType}):`, errorMessage);
        console.warn(
          'SW: App will continue without service worker functionality'
        );
      }

      // Set error status for debugging
      sessionStorage.setItem('sw-status', 'error');
      sessionStorage.setItem('sw-error-type', errorType);

      // In production, silently continue - the app works perfectly without SW
      // Could optionally report to error tracking service here
      if (process.env.NODE_ENV === 'production') {
        // Example: errorReporter.captureException(error, { context: 'sw-registration' })
      }
    };

    const categorizeRegistrationError = (error: unknown): string => {
      if (!error) return 'unknown';

      const errorMessage =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();

      if (errorMessage.includes('insecure')) return 'insecure-context';
      if (errorMessage.includes('network')) return 'network-error';
      if (errorMessage.includes('script')) return 'script-error';
      if (errorMessage.includes('quota')) return 'storage-quota';
      if (errorMessage.includes('permission')) return 'permission-denied';

      return 'registration-failed';
    };

    // Production-ready update handling with comprehensive session protection
    const handleSwUpdate = (event: CustomEvent) => {
      const { timestamp, registration } = event.detail;

      // Enhanced session detection
      const sessionInfo = analyzeUserSession();
      const lastUpdateCheck = localStorage.getItem('sw-last-update-check');
      const timeSinceLastCheck =
        timestamp - parseInt(lastUpdateCheck || '0', 10);

      // Adaptive notification timing based on session criticality
      const getMinNotificationInterval = () => {
        if (sessionInfo.hasUnsavedWork) return 4 * 60 * 60 * 1000; // 4 hours for unsaved work
        if (sessionInfo.hasActiveAuth) return 2 * 60 * 60 * 1000; // 2 hours for authenticated users
        if (sessionInfo.hasRecentActivity) return 60 * 60 * 1000; // 1 hour for recent activity
        return 30 * 60 * 1000; // 30 minutes for inactive sessions
      };

      const minInterval = getMinNotificationInterval();

      if (timeSinceLastCheck > minInterval) {
        localStorage.setItem('sw-last-update-check', timestamp.toString());

        // Contextual messaging based on session state
        const getUpdateMessage = () => {
          if (sessionInfo.hasUnsavedWork) {
            return 'A new version is available. Please save your work before updating.';
          }
          if (sessionInfo.hasActiveAuth) {
            return 'A new version is available. Update when you finish your current task.';
          }
          return 'A new version is available. Refresh to get the latest features.';
        };

        const updateMessage = getUpdateMessage();
        const duration = sessionInfo.hasUnsavedWork
          ? 20000
          : sessionInfo.hasActiveAuth
            ? 15000
            : 10000;

        toast({
          title: 'App Update Available',
          description: updateMessage,
          duration,
          action: (
            <button
              onClick={() => handleUpdateAction(sessionInfo, registration)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {sessionInfo.hasUnsavedWork
                ? 'Update Later'
                : sessionInfo.hasActiveAuth
                  ? 'Update Now'
                  : 'Refresh'}
            </button>
          ),
        });
      }
    };

    const handleUpdateAction = (
      sessionInfo: SessionInfo,
      registration?: ServiceWorkerRegistration
    ) => {
      // Set user consent flag
      localStorage.setItem('user-consented-refresh', 'true');
      localStorage.removeItem('sw-last-update-check');

      if (sessionInfo.hasUnsavedWork) {
        // For unsaved work, show extended warning
        toast({
          title: 'Preparing to Update',
          description:
            'Please save your work. The app will refresh in 10 seconds.',
          duration: 10000,
        });

        // Extended delay for critical work
        setTimeout(() => {
          performControlledRefresh(registration);
        }, 10000);
      } else if (sessionInfo.hasActiveAuth) {
        // For authenticated users, shorter delay
        toast({
          title: 'Updating...',
          description: 'Refreshing to the latest version.',
          duration: 3000,
        });

        setTimeout(() => {
          performControlledRefresh(registration);
        }, 3000);
      } else {
        // For inactive sessions, immediate refresh
        performControlledRefresh(registration);
      }
    };

    const performControlledRefresh = (
      registration?: ServiceWorkerRegistration
    ) => {
      try {
        // If we have a registration, try to activate the waiting worker
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          // The controllerchange event will handle the refresh
        } else {
          // Fallback to regular refresh
          window.location.reload();
        }
      } catch {
        // If controlled refresh fails, fall back to regular refresh
        window.location.reload();
      }
    };

    interface SessionInfo {
      hasActiveAuth: boolean;
      hasUnsavedWork: boolean;
      hasRecentActivity: boolean;
      activityLevel: 'high' | 'medium' | 'low' | 'none';
    }

    const analyzeUserSession = (): SessionInfo => {
      try {
        // Enhanced authentication detection
        const hasActiveAuth = !!(
          localStorage.getItem('auth-token') ||
          sessionStorage.getItem('auth-token') ||
          sessionStorage.getItem('user-active') ||
          document.cookie.includes('next-auth') ||
          document.cookie.includes('session-token')
        );

        // Comprehensive unsaved work detection
        const hasUnsavedWork = !!(
          localStorage.getItem('draft-log') ||
          localStorage.getItem('unsaved-form-data') ||
          localStorage.getItem('auto-save-data') ||
          document.querySelector('form[data-dirty="true"]') ||
          document.querySelector('textarea:not(:empty)') ||
          document.querySelector('input[type="text"]:not([value=""])') ||
          document.querySelector('[contenteditable="true"]:not(:empty)')
        );

        // Activity level analysis
        const lastActivity = parseInt(
          localStorage.getItem('last-user-activity') || '0',
          10
        );
        const timeSinceActivity = Date.now() - lastActivity;

        let activityLevel: SessionInfo['activityLevel'] = 'none';
        let hasRecentActivity = false;

        if (timeSinceActivity < 30000) {
          // 30 seconds
          activityLevel = 'high';
          hasRecentActivity = true;
        } else if (timeSinceActivity < 300000) {
          // 5 minutes
          activityLevel = 'medium';
          hasRecentActivity = true;
        } else if (timeSinceActivity < 1800000) {
          // 30 minutes
          activityLevel = 'low';
          hasRecentActivity = false;
        }

        return {
          hasActiveAuth,
          hasUnsavedWork,
          hasRecentActivity,
          activityLevel,
        };
      } catch {
        // If analysis fails, assume active session for safety
        return {
          hasActiveAuth: true,
          hasUnsavedWork: true,
          hasRecentActivity: true,
          activityLevel: 'high',
        };
      }
    };

    // Add event listener for service worker updates
    window.addEventListener(
      'sw-update-available',
      handleSwUpdate as EventListener
    );

    // Production-ready environment-based registration policy
    const shouldRegister = (): { register: boolean; reason: string } => {
      // Check for explicit disable flag
      if (process.env.NEXT_PUBLIC_SW_DISABLED === 'true') {
        return { register: false, reason: 'explicitly disabled' };
      }

      // Environment detection with fallbacks
      const nodeEnv = process.env.NODE_ENV;
      const isProduction = nodeEnv === 'production';
      const isDevelopment = nodeEnv === 'development';
      const isTest = nodeEnv === 'test';
      const swEnabled = process.env.NEXT_PUBLIC_SW_ENABLED === 'true';

      // Test environment: never register
      if (isTest) {
        return { register: false, reason: 'test environment' };
      }

      // Production environment: register by default for enhanced performance
      if (isProduction) {
        return { register: true, reason: 'production environment' };
      }

      // Development environment: only register if explicitly enabled
      if (isDevelopment) {
        if (swEnabled) {
          return { register: true, reason: 'development with SW enabled' };
        }
        return {
          register: false,
          reason: 'development without explicit enable',
        };
      }

      // Unknown environment: be conservative and don't register
      return { register: false, reason: `unknown environment: ${nodeEnv}` };
    };

    // Execute registration decision
    const registrationDecision = shouldRegister();

    if (registrationDecision.register) {
      // Register service worker - no logging in production
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `SW: Registering service worker (${registrationDecision.reason})`
        );
      }
      registerServiceWorker();
    } else {
      // Skip registration - log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `SW: Skipping service worker registration (${registrationDecision.reason})`
        );
      }
      // Set status for debugging
      sessionStorage.setItem('sw-status', 'skipped');
      sessionStorage.setItem('sw-skip-reason', registrationDecision.reason);
    }

    // Cleanup
    return () => {
      window.removeEventListener(
        'sw-update-available',
        handleSwUpdate as EventListener
      );
    };
  }, [toast]);

  return null;
}
