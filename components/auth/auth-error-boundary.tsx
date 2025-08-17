'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandButton } from '@/components/brand/brand-button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log authentication errors
    console.error('Authentication Error Boundary caught an error:', error, errorInfo);

    // Check if this is an authentication-related error
    const isAuthError = 
      error.message.includes('Authentication') ||
      error.message.includes('Session') ||
      error.message.includes('Token') ||
      error.message.includes('Unauthorized');

    if (isAuthError) {
      // Log auth-specific error context
      console.error('Authentication error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force redirect if signOut fails
      window.location.href = '/auth/login';
    }
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error!} retry={this.handleRetry} />;
      }

      // Check if this is an authentication-related error
      const isAuthError = 
        error?.message.includes('Authentication') ||
        error?.message.includes('Session') ||
        error?.message.includes('Token') ||
        error?.message.includes('Unauthorized');

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="mt-4 text-2xl font-bold">
                {isAuthError ? 'Authentication Error' : 'Something went wrong'}
              </h1>
            </div>

            <Alert variant="destructive">
              <AlertDescription>
                {isAuthError 
                  ? 'There was a problem with your authentication session. Please sign in again.'
                  : 'An unexpected error occurred. Please try refreshing the page or signing in again.'
                }
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && error && (
              <Alert>
                <AlertDescription className="text-xs font-mono">
                  <strong>Error:</strong> {error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              <BrandButton 
                onClick={this.handleRetry}
                variant="primary"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </BrandButton>
              
              {isAuthError && (
                <BrandButton 
                  onClick={this.handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out & Return to Login
                </BrandButton>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useAuthErrorHandler() {
  const handleAuthError = (error: Error) => {
    console.error('Authentication error:', error);
    
    // Check if this is an authentication-related error
    const isAuthError = 
      error.message.includes('Authentication') ||
      error.message.includes('Session') ||
      error.message.includes('Token') ||
      error.message.includes('Unauthorized');

    if (isAuthError) {
      // Force sign out and redirect to login
      signOut({ callbackUrl: '/auth/login' });
    }
  };

  return { handleAuthError };
}