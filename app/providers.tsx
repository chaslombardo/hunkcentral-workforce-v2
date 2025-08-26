// Providers wrapper for the application
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-manager';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="hunkcentral-theme"
        themes={['light', 'dark', 'system']}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
