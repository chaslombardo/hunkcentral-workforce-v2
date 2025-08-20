'use client';

import * as React from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { setTheme, theme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Ensure component is mounted before rendering to avoid hydration issues
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug theme persistence
  React.useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('hunkcentral-theme');
      if (storedTheme && storedTheme !== theme) {
        // Theme mismatch detected - this helps with debugging
        // In production, this would be logged to monitoring service
      }
    }
  }, [theme, mounted]);

  const handleThemeChange = (newTheme: string) => {
    try {
      setTheme(newTheme);
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
          onClick={() => handleThemeChange('light')}
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
          onClick={() => handleThemeChange('dark')}
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
          onClick={() => handleThemeChange('system')}
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
