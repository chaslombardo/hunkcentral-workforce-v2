/**
 * StatusIndicator Component Tests
 *
 * Tests for the enhanced status indicator system built on shadcn/ui Badge
 * with brand theming and consistent status visualization.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  StatusIndicator,
  StatusIndicators,
  getStatusType,
} from '@/components/brand/status-indicator';

describe('StatusIndicator', () => {
  it('renders with default props', () => {
    render(<StatusIndicator status="pending" />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    const badge = screen.getByTestId('status-indicator');
    expect(badge).toHaveClass('bg-yellow-50', 'text-yellow-700');
  });

  it('renders with custom text', () => {
    render(<StatusIndicator status="approved" text="Custom Status" />);

    expect(screen.getByText('Custom Status')).toBeInTheDocument();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<StatusIndicator status="pending" showIcon={false} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    // Icon should not be present
    const badge = screen.getByTestId('status-indicator');
    expect(badge.querySelector('svg')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<StatusIndicator status="pending" size="sm" />);
    expect(screen.getByTestId('status-indicator')).toHaveClass(
      'text-xs',
      'h-5'
    );

    rerender(<StatusIndicator status="pending" size="md" />);
    expect(screen.getByTestId('status-indicator')).toHaveClass(
      'text-sm',
      'h-6'
    );

    rerender(<StatusIndicator status="pending" size="lg" />);
    expect(screen.getByTestId('status-indicator')).toHaveClass(
      'text-sm',
      'h-8'
    );
  });

  it('applies animation classes for processing status when animated', () => {
    render(<StatusIndicator status="processing" animated />);

    const icon = screen.getByTestId('status-indicator').querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  it('does not apply animation classes when animated is false', () => {
    render(<StatusIndicator status="processing" animated={false} />);

    const icon = screen.getByTestId('status-indicator').querySelector('svg');
    expect(icon).not.toHaveClass('animate-spin');
  });

  describe('Brand color mapping', () => {
    it('applies brand green colors for success states', () => {
      const successStatuses = [
        'approved',
        'matched',
        'success',
        'completed',
        'active',
        'open',
      ];

      successStatuses.forEach((status) => {
        const { unmount } = render(<StatusIndicator status={status as any} />);
        expect(screen.getByTestId('status-indicator')).toHaveClass(
          'bg-hunks-green-50',
          'text-hunks-green-700'
        );
        unmount();
      });
    });

    it('applies brand orange colors for warning states', () => {
      const warningStatuses = ['warning', 'processing', 'locked', 'submitted'];

      warningStatuses.forEach((status) => {
        const { unmount } = render(<StatusIndicator status={status as any} />);
        expect(screen.getByTestId('status-indicator')).toHaveClass(
          'bg-hunks-orange-50',
          'text-hunks-orange-700'
        );
        unmount();
      });
    });

    it('applies red colors for error states', () => {
      const errorStatuses = ['rejected', 'error', 'inactive'];

      errorStatuses.forEach((status) => {
        const { unmount } = render(<StatusIndicator status={status as any} />);
        expect(screen.getByTestId('status-indicator')).toHaveClass(
          'bg-red-50',
          'text-red-700'
        );
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<StatusIndicator status="pending" />);

      const badge = screen.getByTestId('status-indicator');
      expect(badge).toHaveAttribute('data-slot', 'badge');
    });

    it('supports custom test ids and data attributes', () => {
      render(<StatusIndicator status="pending" data-custom="test-value" />);

      const badge = screen.getByTestId('status-indicator');
      expect(badge).toHaveAttribute('data-custom', 'test-value');
    });
  });

  describe('Custom styling', () => {
    it('accepts custom className', () => {
      render(<StatusIndicator status="pending" className="custom-class" />);

      expect(screen.getByTestId('status-indicator')).toHaveClass(
        'custom-class'
      );
    });

    it('forwards other props to Badge component', () => {
      render(<StatusIndicator status="pending" data-testid="custom-badge" />);

      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });
  });
});

describe('StatusIndicators pre-configured components', () => {
  it('renders Pending component with correct props', () => {
    render(<StatusIndicators.Pending />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toHaveClass('bg-yellow-50');
  });

  it('renders Approved component with correct props', () => {
    render(<StatusIndicators.Approved />);

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toHaveClass(
      'bg-hunks-green-50'
    );
  });

  it('renders Processing component with animation', () => {
    render(<StatusIndicators.Processing />);

    expect(screen.getByText('Processing')).toBeInTheDocument();
    const icon = screen.getByTestId('status-indicator').querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });
});

describe('getStatusType utility', () => {
  it('returns the status as-is for valid status types', () => {
    expect(getStatusType('pending')).toBe('pending');
    expect(getStatusType('approved')).toBe('approved');
    expect(getStatusType('error')).toBe('error');
  });

  it('maps common variations to standard types', () => {
    expect(getStatusType('in_progress')).toBe('processing');
    expect(getStatusType('in-progress')).toBe('processing');
    expect(getStatusType('review')).toBe('pending');
    expect(getStatusType('cancelled')).toBe('rejected');
    expect(getStatusType('failed')).toBe('error');
    expect(getStatusType('done')).toBe('completed');
  });

  it('handles case insensitive input', () => {
    expect(getStatusType('PENDING')).toBe('pending');
    expect(getStatusType('Approved')).toBe('approved');
    expect(getStatusType('ERROR')).toBe('error');
  });

  it('returns info for unknown status types', () => {
    expect(getStatusType('unknown')).toBe('info');
    expect(getStatusType('')).toBe('info');
  });
});

describe('Integration with existing patterns', () => {
  it('maintains compatibility with existing badge usage', () => {
    // Test that it can be used as a drop-in replacement for Badge
    render(<StatusIndicator status="approved" variant="outline" />);

    const badge = screen.getByTestId('status-indicator');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Approved');
  });

  it('works with existing commission status patterns', () => {
    const commissionStatuses = ['pending', 'matched', 'approved'];

    commissionStatuses.forEach((status) => {
      const { unmount } = render(<StatusIndicator status={status as any} />);
      expect(
        screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))
      ).toBeInTheDocument();
      unmount();
    });
  });

  it('works with existing pay period status patterns', () => {
    const payPeriodStatuses = ['open', 'locked', 'closed'];

    payPeriodStatuses.forEach((status) => {
      const { unmount } = render(<StatusIndicator status={status as any} />);
      expect(
        screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))
      ).toBeInTheDocument();
      unmount();
    });
  });
});
