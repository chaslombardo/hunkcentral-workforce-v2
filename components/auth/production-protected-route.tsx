/**
 * Production Protected Route Component
 * Enhanced route protection with comprehensive error handling and recovery
 */

'use client';

import { useProductionAuth } from '@/hooks/useProductionAuth';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { hasRouteAccess } from '@/lib/routes';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandButton } from '@/components/brand/brand-button';
import { BrandLoading } from '@/components/brand/brand-loading';
import { Shield, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ProductionProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  currentRoute?: string;
  enableAutoRecovery?: boolean;
  fallbackComponent?: React.ComponentType<{
    error: string;
    errorCode: string;
    retry: () => void;
    recover: () => void;
  }>;
}

interface AccessError {
  type: 'auth' | 'role' | 'route' | 'system';
  message: string;
  code: string;
  canRecover: boolean;
  suggestedAction?: string;
}

export function ProductionProtectedRoute({
  children,
  requiredRoles,
  currentRoute,
  enableAutoRecovery = true,
  fallbackComponent: FallbackComponent,
}: ProductionProtectedRouteProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    isRecovering,
    hasRole,
    hasAnyRole,
    recoverSession,
    validateSession,
    signOutSafely,
  } = useProductionAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [accessError, setAccessError] = useState<AccessError | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Parse URL error parameters
  const parseUrlError = useCallback((): AccessError | null => {
    const urlError = searchParams.get('error');
    const reason = searchParams.get('reason');
    
    if (!urlError) return null;

    const errorMappings: Record<string, AccessError> = {
      'access_denied': {
        type: 'role',
        message: reason === 'admin_required' 
          ? 'Administrator access required for this page.'
          : reason === 'manager_required'
          ? 'Manager access required for this page.'
          : reason === 'sales_required'
          ? 'Sales access required for this page.'
          : 'Access denied for this page.',
        code: 'ACCESS_DENIED',
        canRecover: false,
        suggestedAction: 'Contact your administrator for access.'
      },
      'session_required': {
        type: 'auth',
        message: 'Please sign in to access this page.',
        code: 'SESSION_REQUIRED',
        canRecover: true,
        suggestedAction: 'Sign in to continue.'
      },
      'invalid_session': {
        type: 'auth',
        message: 'Your session has expired or is invalid.',
        code: 'INVALID_SESSION',
        canRecover: true,
        suggestedAction: 'Please sign in again.'
      },
      'middleware_error': {
        type: 'system',
        message: 'A system error occurred during authentication.',
        code: 'MIDDLEWARE_ERROR',
        canRecover: true,
        suggestedAction: 'Please try again or contact support.'
      },
      'session_recovery_failed': {
        type: 'auth',
        message: 'Unable to recover your session.',
        code: 'RECOVERY_FAILED',
        canRecover: false,
        suggestedAction: 'Please sign in again.'
      }
    };

    return errorMappings[urlError] || {
      type: 'system',
      message: 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      canRecover: true,
      suggestedAction: 'Please try again.'
    };
  }, [searchParams]);

  // Validate access permissions
  const validateAccess = useCallback((): AccessError | null => {
    if (!user) return null;

    // Check role-based access
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasAnyRole(requiredRoles)) {
        return {
          type: 'role',
          message: `This page requires one of the following roles: ${requiredRoles.join(', ')}`,
          code: 'INSUFFICIENT_ROLES',
          canRecover: false,
          suggestedAction: 'Contact your administrator for the required permissions.'
        };
      }
    }

    // Check route-based access
    if (currentRoute && !hasRouteAccess(currentRoute, user.roles)) {
      return {
        type: 'route',
        message: 'You don\'t have permission to access this page.',
        code: 'ROUTE_ACCESS_DENIED',
        canRecover: false,
        suggestedAction: 'Navigate to a page you have access to.'
      };
    }

    return null;
  }, [user, requiredRoles, currentRoute, hasAnyRole]);

  // Handle access validation
  useEffect(() => {
    // First check URL errors
    const urlError = parseUrlError();
    if (urlError) {
      setAccessError(urlError);
      return;
    }

    // Then validate current access
    if (isAuthenticated && user) {
      const accessValidation = validateAccess();
      setAccessError(accessValidation);
    } else if (!isLoading && !isAuthenticated && !error) {
      setAccessError({
        type: 'auth',
        message: 'Authentication required to access this page.',
        code: 'AUTH_REQUIRED',
        canRecover: true,
        suggestedAction: 'Please sign in to continue.'
      });
    }
  }, [parseUrlError, validateAccess, isAuthenticated, user, isLoading, error]);

  // Auto-recovery for certain error types
  useEffect(() => {
    if (enableAutoRecovery && error && !isRecovering) {
      const recoverableErrors = ['INVALID_SESSION_STRUCTURE', 'VALIDATION_FAILED'];
      if (errorCode && recoverableErrors.includes(errorCode)) {
        const timeout = setTimeout(() => {
          recoverSession();
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [enableAutoRecovery, error, errorCode, isRecovering, recoverSession]);

  // Handle retry action
  const handleRetry = useCallback(async () => {
    setIsValidating(true);
    setAccessError(null);
    
    try {
      const isValid = await validateSession();
      if (!isValid) {
        await recoverSession();
      }
      
      // Clear URL error parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('reason');
      router.replace(url.pathname + url.search);
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsValidating(false);
    }
  }, [validateSession, recoverSession, router]);

  // Handle recovery action
  const handleRecover = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const recovered = await recoverSession();
      if (recovered) {
        setAccessError(null);
        // Clear URL error parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        url.searchParams.delete('reason');
        router.replace(url.pathname + url.search);
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
    } finally {
      setIsValidating(false);
    }
  }, [recoverSession, router]);

  // Render loading state
  if (isLoading || isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <BrandLoading variant="spinner" size="lg" />
          <p className="text-sm text-muted-foreground">
            {isValidating ? 'Validating access...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Render authentication error
  if (error && !accessError) {
    const authError: AccessError = {
      type: 'auth',
      message: error,
      code: errorCode || 'AUTH_ERROR',
      canRecover: ['INVALID_SESSION_STRUCTURE', 'VALIDATION_FAILED', 'REFRESH_FAILED'].includes(errorCode || ''),
      suggestedAction: 'Please try again or sign in.'
    };
    
    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={authError.message}
          errorCode={authError.code}
          retry={handleRetry}
          recover={handleRecover}
        />
      );
    }

    return <ErrorDisplay error={authError} onRetry={handleRetry} onRecover={handleRecover} onSignOut={signOutSafely} />;
  }

  // Render access error
  if (accessError) {
    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={accessError.message}
          errorCode={accessError.code}
          retry={handleRetry}
          recover={handleRecover}
        />
      );
    }

    return <ErrorDisplay error={accessError} onRetry={handleRetry} onRecover={handleRecover} onSignOut={signOutSafely} />;
  }

  // Render protected content
  return (
    <AuthErrorBoundary 
      enableAutoRecovery={enableAutoRecovery}
      maxRetries={3}
    >
      {children}
    </AuthErrorBoundary>
  );
}

// Error display component
interface ErrorDisplayProps {
  error: AccessError;
  onRetry: () => void;
  onRecover: () => void;
  onSignOut: () => void;
}

function ErrorDisplay({ error, onRetry, onRecover, onSignOut }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'role':
      case 'route':
        return <Shield className="mx-auto h-12 w-12 text-destructive" />;
      case 'auth':
        return <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />;
      default:
        return <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'role':
        return 'Access Denied';
      case 'route':
        return 'Page Restricted';
      case 'auth':
        return 'Authentication Required';
      default:
        return 'Access Error';
    }
  };

  const getActions = () => {
    const actions = [];

    // Retry action for recoverable errors
    if (error.canRecover) {
      actions.push(
        <BrandButton 
          key="retry"
          onClick={onRetry}
          variant="primary"
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </BrandButton>
      );

      // Recovery action for auth errors
      if (error.type === 'auth') {
        actions.push(
          <BrandButton 
            key="recover"
            onClick={onRecover}
            variant="outline"
            className="w-full"
          >
            Recover Session
          </BrandButton>
        );
      }
    }

    // Navigation actions
    if (error.type === 'role' || error.type === 'route') {
      actions.push(
        <BrandButton key="dashboard" asChild variant="outline" className="w-full">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Link>
        </BrandButton>
      );
    }

    // Sign out action
    actions.push(
      <BrandButton 
        key="signout"
        onClick={onSignOut}
        variant="ghost"
        className="w-full"
      >
        Sign Out
      </BrandButton>
    );

    return actions;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          {getErrorIcon()}
          <h1 className="mt-4 text-2xl font-bold">
            {getErrorTitle()}
          </h1>
        </div>

        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>

        {error.suggestedAction && (
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Suggestion:</strong> {error.suggestedAction}
            </AlertDescription>
          </Alert>
        )}

        {process.env.NODE_ENV === 'development' && (
          <Alert>
            <AlertDescription className="text-xs font-mono">
              <strong>Error Code:</strong> {error.code}
              <br />
              <strong>Type:</strong> {error.type}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-2">
          {getActions()}
        </div>
      </div>
    </div>
  );
}