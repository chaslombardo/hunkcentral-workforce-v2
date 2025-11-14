import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  NavigationProvider,
  useNavigation,
} from '@/contexts/navigation-context';
import { useSession } from '@/hooks/useSession';

// Mock the useSession hook
vi.mock('@/hooks/useSession');
const mockUseSession = useSession as ReturnType<typeof vi.fn>;

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Test component that uses the navigation context
function TestComponent() {
  const { state, isActiveRoute, isActiveSection } = useNavigation();

  return (
    <div>
      <div data-testid="current-path">{state.currentPath}</div>
      <div data-testid="current-section">{state.currentSection}</div>
      <div data-testid="is-dashboard-active">
        {isActiveRoute('/dashboard').toString()}
      </div>
      <div data-testid="is-dashboard-section">
        {isActiveSection('dashboard').toString()}
      </div>
      <div data-testid="badges-count">{Object.keys(state.badges).length}</div>
      <div data-testid="is-loading">{state.isLoading.toString()}</div>
    </div>
  );
}

describe('NavigationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('provides navigation state and utilities', async () => {
    // Mock user session
    mockUseSession.mockReturnValue({
      user: {
        id: '1',
        fullName: 'Test User',
        roles: ['captain', 'manager'],
      },
      hasRole: vi.fn(),
      hasAnyRole: vi.fn().mockReturnValue(true),
    });

    // Mock API responses
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ count: 3 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ count: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ count: 2 }),
      });

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    // Check initial state
    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
    expect(screen.getByTestId('current-section')).toHaveTextContent(
      'dashboard'
    );
    expect(screen.getByTestId('is-dashboard-active')).toHaveTextContent('true');
    expect(screen.getByTestId('is-dashboard-section')).toHaveTextContent(
      'true'
    );

    // Wait for badges to load
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Verify API calls were made
    expect(global.fetch).toHaveBeenCalledWith('/api/navigation/pending-logs');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/navigation/pending-commissions'
    );
    expect(global.fetch).toHaveBeenCalledWith('/api/navigation/draft-logs');
  });

  it('handles user without roles', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: '1',
        fullName: 'Test User',
        roles: [],
      },
      hasRole: vi.fn(),
      hasAnyRole: vi.fn().mockReturnValue(false),
    });

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
    expect(screen.getByTestId('current-section')).toHaveTextContent(
      'dashboard'
    );
  });

  it('handles no user session', () => {
    mockUseSession.mockReturnValue({
      user: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn().mockReturnValue(false),
    });

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
    expect(screen.getByTestId('badges-count')).toHaveTextContent('0');
  });
});
