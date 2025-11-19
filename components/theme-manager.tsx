'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes';
import {
  Moon,
  Sun,
  Monitor,
  Check,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useThemeManager } from '@/lib/theme';

// Enhanced Theme Provider with error boundary
export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
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

// Theme Switcher Component
export function ThemeSwitcher() {
  const { mounted, theme, systemTheme, setTheme } = useThemeManager();

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="relative">
        <div className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Loading theme switcher</span>
      </Button>
    );
  }

  // Get the appropriate icon based on current theme
  const getCurrentIcon = () => {
    if (theme === 'system') {
      return systemTheme === 'dark' ? Moon : Sun;
    }
    return theme === 'dark' ? Moon : Sun;
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={`Current theme: ${theme}. Click to change theme.`}
        >
          <CurrentIcon className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
          <span className="sr-only">
            Current theme: {theme}. Click to change theme.
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'cursor-pointer',
            theme === 'light' && 'bg-accent text-accent-foreground'
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="flex-1">Light</span>
          {theme === 'light' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'cursor-pointer',
            theme === 'dark' && 'bg-accent text-accent-foreground'
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="flex-1">Dark</span>
          {theme === 'dark' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(
            'cursor-pointer',
            theme === 'system' && 'bg-accent text-accent-foreground'
          )}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="flex-1">System</span>
          {theme === 'system' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        {theme === 'system' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              System: {systemTheme === 'dark' ? 'Dark' : 'Light'}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Theme Debug Panel Component
interface ThemeDebugProps {
  enabled?: boolean;
}

export function ThemeDebug({ enabled = false }: ThemeDebugProps) {
  const {
    mounted,
    theme,
    resolvedTheme,
    systemTheme,
    debugInfo,
    validateThemeConsistency,
    refreshTheme,
  } = useThemeManager();

  if (!enabled || !mounted) return null;

  const { isConsistent, issues } = validateThemeConsistency();

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur-sm border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Theme Debug
          {isConsistent ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Theme:</span>
            <Badge variant="outline" className="ml-1">
              {theme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Resolved:</span>
            <Badge variant="outline" className="ml-1">
              {resolvedTheme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">System:</span>
            <Badge variant="outline" className="ml-1">
              {systemTheme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Stored:</span>
            <Badge variant="outline" className="ml-1">
              {debugInfo.storedTheme || 'null'}
            </Badge>
          </div>
        </div>

        <div>
          <span className="font-medium">Document Class:</span>
          <div className="text-muted-foreground break-all">
            {debugInfo.documentClass || 'none'}
          </div>
        </div>

        <div>
          <span className="font-medium">System Preference:</span>
          <Badge variant="outline" className="ml-1">
            {debugInfo.systemPreference}
          </Badge>
        </div>

        {issues.length > 0 && (
          <div className="space-y-1">
            <span className="font-medium text-yellow-600">Issues:</span>
            {issues.map((issue, index) => (
              <div key={index} className="text-yellow-600 text-xs">
                • {issue}
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={refreshTheme}
          className="w-full"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Theme
        </Button>
      </CardContent>
    </Card>
  );
}

// Combined Theme Manager Component (includes provider + switcher)
interface ThemeManagerProps extends NextThemesProviderProps {
  showSwitcher?: boolean;
  showDebug?: boolean;
  switcherProps?: {
    className?: string;
    variant?: 'outline' | 'ghost' | 'default';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  };
}

export function ThemeManager({
  children,
  showSwitcher = false,
  showDebug = false,
  switcherProps,
  ...themeProviderProps
}: ThemeManagerProps) {
  return (
    <ThemeProvider {...themeProviderProps}>
      {children}
      {showSwitcher && (
        <div className={switcherProps?.className}>
          <ThemeSwitcher />
        </div>
      )}
      {showDebug && <ThemeDebug enabled={true} />}
    </ThemeProvider>
  );
}
