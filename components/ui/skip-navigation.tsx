'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipNavigationProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
  className?: string;
}

/**
 * SkipNavigation provides keyboard users with a way to skip repetitive navigation
 * and jump directly to main content areas.
 */
export function SkipNavigation({
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
  ],
  className,
}: SkipNavigationProps) {
  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      <nav aria-label="Skip navigation">
        <ul className="flex flex-col gap-1 p-2 bg-background border border-border rounded-md shadow-lg">
          {links.map((link, index) => (
            <li key={index}>
              <a
                href={link.href}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium',
                  'h-9 px-4 py-2',
                  'bg-primary text-primary-foreground shadow',
                  'hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'transition-colors'
                )}
                onFocus={(e) => {
                  // Ensure the skip link is visible when focused
                  e.currentTarget.scrollIntoView({ block: 'nearest' });
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * MainContentWrapper provides a landmark for the main content area
 */
export function MainContentWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main-content"
      className={className}
      role="main"
      aria-label="Main content"
    >
      {children}
    </main>
  );
}

/**
 * NavigationWrapper provides a landmark for the navigation area
 */
export function NavigationWrapper({
  children,
  className,
  ariaLabel = 'Main navigation',
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <nav
      id="navigation"
      className={className}
      role="navigation"
      aria-label={ariaLabel}
    >
      {children}
    </nav>
  );
}

/**
 * FooterWrapper provides a landmark for the footer area
 */
export function FooterWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      id="footer"
      className={className}
      role="contentinfo"
      aria-label="Footer"
    >
      {children}
    </footer>
  );
}
