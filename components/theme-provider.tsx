'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  // Add error boundary for theme provider
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (
        error.message?.includes('theme') ||
        error.message?.includes('localStorage')
      ) {
        console.error('Theme provider error:', error);
        setHasError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('theme') ||
        event.reason?.message?.includes('localStorage')
      ) {
        console.error('Theme provider promise rejection:', event.reason);
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  if (hasError) {
    // Fallback to light theme if there's an error
    return <div className="light">{children}</div>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
