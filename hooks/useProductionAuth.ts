/**
 * Production Authentication Hook
 * Enhanced client-side authentication with error recovery and graceful handling
 */

'use client';

import { useSession as useNextAuthSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from '@/types';
import type { SessionUser } from '@/lib/auth';

export interface ProductionAuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  lastValidated: Date | null;
  retryCount: number;
  isRecovering: boolean;
}

export interface ProductionAuthActions {
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  refreshSession: () => Promise<boolean>;
  recoverSession: () => Promise<boolean>;
  handleAuthError: (error: Error | string, context?: Record<string, unknown>) => void;
  signOutSafely: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const MAX_RETRY_ATTEMPTS = 3;
const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RECOVERY_TIMEOUT = 10000; // 10 seconds

export function useProductionAuth(): ProductionAuthState & ProductionAuthActions {
  const { data: session, status, update } = useNextAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [state, setState] = useState<ProductionAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    errorCode: null,
    lastValidated: null,
    retryCount: 0,
    isRecovering: false,
  });

  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate session structure and integrity
  const validateSessionData = useCallback((sessionData: any): { 
    isValid: boolean; 
    user: SessionUser | null; 
    error?: string;
    errorCode?: string;
  } => {
    if (!sessionData?.user) {
      return { 
        isValid: false, 
        user: null, 
        error: 'No session data',
        errorCode: 'NO_SESSION'
      };
    }

    const user = sessionData.user as SessionUser;

    // Validate required fields
    if (!user.id || !user.email || !user.roles) {
      return { 
        isValid: false, 
        user: null, 
        error: 'Invalid session structure',
        errorCode: 'INVALID_SESSION_STRUCTURE'
      };
    }

    // Validate roles array
    if (!Array.isArray(user.roles) || user.roles.length === 0) {
      return { 
        isValid: false, 
        user: null, 
        error: 'Invalid user roles',
        errorCode: 'INVALID_ROLES'
      };
    }

    return { isValid: true, user };
  }, []);

  // Handle authentication errors with context logging
  const handleAuthError = useCallback((
    error: Error | string, 
    context: Record<string, unknown> = {}
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorCode = context.errorCode as string || 'UNKNOWN_ERROR';
    
    console.error('Production Auth Error:', {
      message: errorMessage,
      code: errorCode,
      context,
      timestamp: new Date().toISOString(),
      pathname,
      sessionStatus: status,
    });

    setState(prev => ({
      ...prev,
      error: errorMessage,
      errorCode,
      isAuthenticated: false,
      user: null,
    }));

    // Send error to monitoring (in production)
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with your error monitoring service
      fetch('/api/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorMessage,
          code: errorCode,
          context: {
            ...context,
            pathname,
            sessionStatus: status,
            timestamp: new Date().toISOString(),
          },
        }),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    }
  }, [pathname, status]);

  // Refresh session with retry logic
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, errorCode: null }));
      
      await update();
      
      // Wait for session to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      handleAuthError(error instanceof Error ? error : new Error(String(error)), {
        action: 'refresh_session',
        errorCode: 'REFRESH_FAILED'
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [update, handleAuthError]);

  // Recover session with multiple strategies
  const recoverSession = useCallback(async (): Promise<boolean> => {
    if (state.isRecovering) {
      return false;
    }

    setState(prev => ({ ...prev, isRecovering: true, error: null, errorCode: null }));

    try {
      // Strategy 1: Try to refresh the current session
      const refreshSuccess = await refreshSession();
      if (refreshSuccess) {
        setState(prev => ({ ...prev, isRecovering: false, retryCount: 0 }));
        return true;
      }

      // Strategy 2: Fetch session directly from API
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (response.ok) {
        const sessionData = await response.json();
        const validation = validateSessionData(sessionData);
        
        if (validation.isValid && validation.user) {
          setState(prev => ({
            ...prev,
            user: validation.user,
            isAuthenticated: true,
            isRecovering: false,
            error: null,
            errorCode: null,
            retryCount: 0,
            lastValidated: new Date(),
          }));
          return true;
        }
      }

      // Strategy 3: Force a page reload as last resort
      if (state.retryCount < MAX_RETRY_ATTEMPTS) {
        setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, state.retryCount)));
        
        return recoverSession();
      }

      // All strategies failed
      handleAuthError('Session recovery failed after multiple attempts', {
        action: 'recover_session',
        errorCode: 'RECOVERY_FAILED',
        retryCount: state.retryCount,
      });

      return false;
    } catch (error) {
      handleAuthError(error instanceof Error ? error : new Error(String(error)), {
        action: 'recover_session',
        errorCode: 'RECOVERY_ERROR'
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [state.isRecovering, state.retryCount, refreshSession, validateSessionData, handleAuthError]);

  // Validate current session
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!session) {
      return false;
    }

    const validation = validateSessionData(session);
    
    if (!validation.isValid) {
      handleAuthError(validation.error || 'Session validation failed', {
        action: 'validate_session',
        errorCode: validation.errorCode || 'VALIDATION_FAILED'
      });
      
      // Attempt recovery
      return recoverSession();
    }

    setState(prev => ({
      ...prev,
      user: validation.user,
      isAuthenticated: true,
      error: null,
      errorCode: null,
      lastValidated: new Date(),
    }));

    return true;
  }, [session, validateSessionData, handleAuthError, recoverSession]);

  // Safe sign out with error handling
  const signOutSafely = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      });
    } catch (error) {
      handleAuthError(error instanceof Error ? error : new Error(String(error)), {
        action: 'sign_out',
        errorCode: 'SIGNOUT_FAILED'
      });
      
      // Force redirect if signOut fails
      window.location.href = '/auth/login';
    }
  }, [handleAuthError]);

  // Role checking utilities
  const hasRole = useCallback((role: UserRole): boolean => {
    return state.user?.roles?.includes(role) ?? false;
  }, [state.user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  // Handle session changes
  useEffect(() => {
    if (status === 'loading') {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (status === 'unauthenticated') {
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        errorCode: null,
      }));
      return;
    }

    if (status === 'authenticated') {
      validateSession();
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [status, validateSession]);

  // Set up periodic session validation
  useEffect(() => {
    if (state.isAuthenticated && !state.error) {
      validationTimeoutRef.current = setTimeout(() => {
        validateSession();
      }, VALIDATION_INTERVAL);
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [state.isAuthenticated, state.error, validateSession]);

  // Handle recovery timeout
  useEffect(() => {
    if (state.isRecovering) {
      recoveryTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isRecovering: false }));
        handleAuthError('Session recovery timed out', {
          action: 'recovery_timeout',
          errorCode: 'RECOVERY_TIMEOUT'
        });
      }, RECOVERY_TIMEOUT);
    }

    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, [state.isRecovering, handleAuthError]);

  // Auto-recovery on authentication errors
  useEffect(() => {
    if (state.error && !state.isRecovering && state.retryCount < MAX_RETRY_ATTEMPTS) {
      const shouldAutoRecover = [
        'INVALID_SESSION_STRUCTURE',
        'REFRESH_FAILED',
        'VALIDATION_FAILED'
      ].includes(state.errorCode || '');

      if (shouldAutoRecover) {
        const timeout = setTimeout(() => {
          recoverSession();
        }, 1000 * Math.pow(2, state.retryCount)); // Exponential backoff

        return () => clearTimeout(timeout);
      }
    }
  }, [state.error, state.errorCode, state.isRecovering, state.retryCount, recoverSession]);

  return {
    ...state,
    hasRole,
    hasAnyRole,
    refreshSession,
    recoverSession,
    handleAuthError,
    signOutSafely,
    validateSession,
  };
}