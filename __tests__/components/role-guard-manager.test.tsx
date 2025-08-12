import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '@/components/auth/role-guard';
import { useSession } from '@/hooks/useSession';
import { vi } from 'vitest';

// Mock the useSession hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

describe('RoleGuard Manager Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow manager to access manager-required content', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: 'manager1',
        email: 'manager@test.com',
        fullName: 'Test Manager',
        roles: ['manager'],
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard requiredRoles={['manager']}>
        <div>Manager Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Manager Content')).toBeInTheDocument();
  });

  it('should allow manager to access admin-or-manager content', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: 'manager1',
        email: 'manager@test.com',
        fullName: 'Test Manager',
        roles: ['manager'],
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard requiredRoles={['admin', 'manager']}>
        <div>Admin or Manager Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Admin or Manager Content')).toBeInTheDocument();
  });

  it('should deny manager access to admin-only content', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: 'manager1',
        email: 'manager@test.com',
        fullName: 'Test Manager',
        roles: ['manager'],
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard requiredRoles={['admin']}>
        <div>Admin Only Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to view this content/)).toBeInTheDocument();
    expect(screen.getByText(/Required roles: admin/)).toBeInTheDocument();
  });

  it('should allow admin-manager user to access admin content', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: 'adminmanager1',
        email: 'adminmanager@test.com',
        fullName: 'Test Admin Manager',
        roles: ['admin', 'manager'],
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard requiredRoles={['admin']}>
        <div>Admin Only Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
  });

  it('should require all roles when requireAll is true', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: 'manager1',
        email: 'manager@test.com',
        fullName: 'Test Manager',
        roles: ['manager'],
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard requiredRoles={['admin', 'manager']} requireAll={true}>
        <div>Admin AND Manager Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Admin AND Manager Content')).not.toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to view this content/)).toBeInTheDocument();
    expect(screen.getByText(/Required roles: admin and manager/)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = render(
      <RoleGuard requiredRoles={['manager']}>
        <div>Manager Content</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show fallback for unauthenticated users', () => {
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <RoleGuard requiredRoles={['manager']} fallback={<div>Please log in</div>}>
        <div>Manager Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Please log in')).toBeInTheDocument();
    expect(screen.queryByText('Manager Content')).not.toBeInTheDocument();
  });
});