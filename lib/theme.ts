'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Theme types
export type ThemeOption = 'light' | 'dark' | 'system';

// Theme debug info interface
export interface ThemeDebugInfo {
  storedTheme: string | null;
  documentClass: string;
  systemPreference: string;
}

// Theme validation result
export interface ThemeValidationResult {
  isConsistent: boolean;
  issues: string[];
}

// Consolidated theme hook that includes debug functionality
export function useThemeManager() {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ThemeDebugInfo>({
    storedTheme: null,
    documentClass: '',
    systemPreference: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const updateDebugInfo = () => {
      const storedTheme = localStorage.getItem('hunkcentral-theme');
      const documentClass = document.documentElement.className;
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      setDebugInfo({
        storedTheme,
        documentClass,
        systemPreference,
      });
    };

    updateDebugInfo();

    // Listen for theme changes
    const observer = new MutationObserver(updateDebugInfo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDebugInfo);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateDebugInfo);
    };
  }, [mounted]);

  const validateThemeConsistency = (): ThemeValidationResult => {
    if (!mounted) return { isConsistent: true, issues: [] };

    const issues: string[] = [];
    const { storedTheme, documentClass, systemPreference } = debugInfo;

    // Check if stored theme matches current theme
    if (storedTheme && storedTheme !== theme) {
      issues.push(
        `Stored theme (${storedTheme}) doesn't match current theme (${theme})`
      );
    }

    // Check if document class reflects the resolved theme
    const expectedClass = resolvedTheme === 'dark' ? 'dark' : '';
    const hasCorrectClass = expectedClass
      ? documentClass.includes('dark')
      : !documentClass.includes('dark');

    if (!hasCorrectClass) {
      issues.push(
        `Document class (${documentClass}) doesn't reflect resolved theme (${resolvedTheme})`
      );
    }

    // Check system theme consistency
    if (theme === 'system' && systemTheme !== systemPreference) {
      issues.push(
        `System theme mismatch: detected (${systemTheme}) vs actual (${systemPreference})`
      );
    }

    return {
      isConsistent: issues.length === 0,
      issues,
    };
  };

  const refreshTheme = () => {
    if (typeof window !== 'undefined') {
      const event = new StorageEvent('storage', {
        key: 'hunkcentral-theme',
        newValue: localStorage.getItem('hunkcentral-theme'),
        storageArea: localStorage,
      });
      window.dispatchEvent(event);
    }
  };

  const changeTheme = async (newTheme: ThemeOption) => {
    try {
      setTheme(newTheme);

      // Sync with database (fire and forget - don't block UI)
      if (typeof window !== 'undefined') {
        import('@/lib/actions/theme-actions').then(
          ({ updateThemePreference }) => {
            updateThemePreference(newTheme).catch((error) => {
              console.warn(
                'Failed to sync theme preference to database:',
                error
              );
            });
          }
        );
      }

      // Verify the theme was set correctly
      setTimeout(() => {
        const storedTheme = localStorage.getItem('hunkcentral-theme');
        if (storedTheme !== newTheme) {
          console.warn('Theme persistence issue:', {
            expected: newTheme,
            stored: storedTheme,
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  return {
    // Core theme state
    mounted,
    theme,
    resolvedTheme,
    systemTheme,
    setTheme: changeTheme,

    // Debug functionality
    debugInfo,
    validateThemeConsistency,
    refreshTheme,
  };
}

// Theme utility functions
export const themeUtils = {
  getThemeIcon: (
    theme: string | undefined,
    systemTheme: string | undefined
  ) => {
    if (theme === 'system') {
      return systemTheme === 'dark' ? 'moon' : 'sun';
    }
    return theme === 'dark' ? 'moon' : 'sun';
  },

  getThemeLabel: (theme: string | undefined) => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
  },

  isValidTheme: (theme: string): theme is ThemeOption => {
    return ['light', 'dark', 'system'].includes(theme);
  },
};
