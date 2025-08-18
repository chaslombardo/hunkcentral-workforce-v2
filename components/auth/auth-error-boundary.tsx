'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandButton } from '@/components/brand/brand-button';
import { AlertTriangle, RefreshCw, Shield, Wifi, WifiOff } from 'lucide-react';
import { useProductionAuth } from '@/hooks/useProductionAuth';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorCode?: string;
  retryCount: number;
  isRecovering: boolean;
  lastErrorTime?: Date;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void; recover: () => void }>;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  private recoveryTimeout?: NodeJS.Timeout;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0, 
      isRecovering: false 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: new Date(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorCode: this.determineErrorCode(error),
    });

    // Enhanced error logging with context
    const errorContext = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || 'Not available',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      errorCode: this.determineErrorCode(error),
      isAuthError: this.isAuthenticationError(error),
    };

    console.error('Production Auth Error Boundary:', errorContext);

    // Send to error monitoring in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorContext);
    }

    // Auto-recovery for certain error types
    if (this.props.enableAutoRecovery && this.shouldAutoRecover(error)) {
      this.scheduleAutoRecovery();
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private determineErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('session') && message.includes('expired')) {
      return 'SESSION_EXPIRED';
    }
    if (message.includes('authentication') && message.includes('required')) {
      return 'AUTH_REQUIRED';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('token') && message.includes('invalid')) {
      return 'INVALID_TOKEN';
    }
    if (message.includes('session') && message.includes('invalid')) {
      return 'INVALID_SESSION';
    }
    
    return 'UNKNOWN_AUTH_ERROR';
  }

  private isAuthenticationError(error: Error): boolean {
    const authKeywords = [
      'authentication', 'session', 'token', 'unauthorized', 
      'permission', 'access denied', 'forbidden', 'signin'
    ];
    
    return authKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  private shouldAutoRecover(error: Error): boolean {
    const recoverableErrors = [
      'SESSION_EXPIRED', 'INVALID_SESSION', 'NETWORK_ERROR'
    ];
    
    return recoverableErrors.includes(this.determineErrorCode(error)) &&
           this.state.retryCount < (this.props.maxRetries || 3);
  }

  private scheduleAutoRecovery() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Max 10 seconds
    
    this.recoveryTimeout = setTimeout(() => {
      this.handleRecovery();
    }, delay);
  }

  private async reportError(errorContext: {
    message: string;
    stack?: string;
    componentStack: string;
    timestamp: string;
    url: string;
    userAgent: string;
    errorCode: string;
    isAuthError: boolean;
  }) {
    try {
      await fetch('/api/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'auth_error_boundary',
          ...errorContext,
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  handleRetry = () => {
    this.setState(prev => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorCode: undefined,
      retryCount: prev.retryCount + 1,
      isRecovering: false,
    }));
  };

  handleRecovery = async () => {
    this.setState({ isRecovering: true });

    try {
      // Attempt to recover the session
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const session = await response.json();
        if (session?.user) {
          // Session recovered successfully
          this.handleRetry();
          return;
        }
      }

      // If session recovery fails, try refreshing the page
      if (this.state.retryCount < (this.props.maxRetries || 3)) {
        window.location.reload();
      } else {
        // Max retries reached, force sign out
        this.handleSignOut();
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/login?error=session_recovery_failed' });
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force redirect if signOut fails
      window.location.href = '/auth/login?error=signout_failed';
    }
  };

  private getErrorIcon() {
    switch (this.state.errorCode) {
      case 'NETWORK_ERROR':
        return <WifiOff className="mx-auto h-12 w-12 text-destructive" />;
      case 'PERMISSION_DENIED':
        return <Shield className="mx-auto h-12 w-12 text-destructive" />;
      default:
        return <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />;
    }
  }

  private getErrorTitle() {
    switch (this.state.errorCode) {
      case 'SESSION_EXPIRED':
        return 'Session Expired';
      case 'AUTH_REQUIRED':
        return 'Authentication Required';
      case 'PERMISSION_DENIED':
        return 'Access Denied';
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'INVALID_TOKEN':
      case 'INVALID_SESSION':
        return 'Session Invalid';
      default:
        return 'Authentication Error';
    }
  }

  private getErrorMessage() {
    switch (this.state.errorCode) {
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please sign in again to continue.';
      case 'AUTH_REQUIRED':
        return 'Authentication is required to access this page.';
      case 'PERMISSION_DENIED':
        return 'You don\'t have permission to access this resource.';
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'INVALID_TOKEN':
      case 'INVALID_SESSION':
        return 'Your session is invalid. Please sign in again.';
      default:
        return 'An authentication error occurred. Please try signing in again.';
    }
  }

  private getRecoveryActions() {
    const { errorCode, isRecovering, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;
    const isNetworkError = errorCode === 'NETWORK_ERROR';
    const isRecoverableError = ['SESSION_EXPIRED', 'INVALID_SESSION', 'NETWORK_ERROR'].includes(errorCode || '');

    return (
      <div className="flex flex-col space-y-2">
        {canRetry && (
          <BrandButton 
            onClick={this.handleRetry}
            variant="primary"
            className="w-full"
            disabled={isRecovering}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Try Again'}
          </BrandButton>
        )}
        
        {isRecoverableError && canRetry && (
          <BrandButton 
            onClick={this.handleRecovery}
            variant="outline"
            className="w-full"
            disabled={isRecovering}
          >
            <Wifi className="mr-2 h-4 w-4" />
            {isNetworkError ? 'Check Connection' : 'Recover Session'}
          </BrandButton>
        )}
        
        <BrandButton 
          onClick={this.handleSignOut}
          variant={canRetry ? "ghost" : "outline"}
          className="w-full"
          disabled={isRecovering}
        >
          Sign Out & Return to Login
        </BrandButton>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={error!} 
            retry={this.handleRetry} 
            recover={this.handleRecovery}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center">
              {this.getErrorIcon()}
              <h1 className="mt-4 text-2xl font-bold">
                {this.getErrorTitle()}
              </h1>
            </div>

            <Alert variant="destructive">
              <AlertDescription>
                {this.getErrorMessage()}
              </AlertDescription>
            </Alert>

            {this.state.retryCount > 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  Retry attempt {this.state.retryCount} of {this.props.maxRetries || 3}
                </AlertDescription>
              </Alert>
            )}

            {process.env.NODE_ENV === 'development' && error && (
              <Alert>
                <AlertDescription className="text-xs font-mono">
                  <strong>Error:</strong> {error.message}
                  <br />
                  <strong>Code:</strong> {this.state.errorCode}
                </AlertDescription>
              </Alert>
            )}

            {this.getRecoveryActions()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced hook version for functional components
export function useAuthErrorHandler() {
  const { handleAuthError: productionHandleAuthError, recoverSession } = useProductionAuth();

  const handleAuthError = async (error: Error, context?: Record<string, unknown>) => {
    console.error('Authentication error:', error, context);
    
    // Use production auth error handler
    productionHandleAuthError(error, context);
    
    // Check if this is a recoverable authentication error
    const isRecoverableAuthError = 
      error.message.includes('Session') ||
      error.message.includes('Token') ||
      error.message.includes('expired');

    if (isRecoverableAuthError) {
      // Attempt recovery first
      const recovered = await recoverSession();
      if (!recovered) {
        // If recovery fails, force sign out
        await signOut({ callbackUrl: '/auth/login?error=session_recovery_failed' });
      }
    } else if (
      error.message.includes('Authentication') ||
      error.message.includes('Unauthorized')
    ) {
      // Force sign out for non-recoverable auth errors
      await signOut({ callbackUrl: '/auth/login?error=authentication_failed' });
    }
  };

  return { handleAuthError };
}