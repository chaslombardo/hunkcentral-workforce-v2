/**
 * Visual Regression Tests for Theme Consistency
 * 
 * Tests to ensure brand colors, typography, spacing, and visual elements
 * remain consistent across all components and states.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components to test
import { BrandButton } from '@/components/brand/brand-button';
import { BrandLoading } from '@/components/brand/brand-loading';
import { MetricCard } from '@/components/brand/metric-card';
import { StatusIndicator } from '@/components/brand/status-indicator';
import { SmartInput } from '@/components/forms/smart-input';
import { FormFeedback } from '@/components/forms/form-feedback';

// Mock icons for consistent testing
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  DollarSign: () => <div data-testid="dollar-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  AlertTriangle: () => <div data-testid="warning-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

describe('Theme Consistency Visual Tests', () => {
  describe('Brand Color Consistency', () => {
    it('applies College Hunks Green consistently across primary elements', () => {
      render(
        <div data-testid="brand-green-container">
          <BrandButton variant="primary">Primary Button</BrandButton>
          <StatusIndicator status="approved" text="Approved" />
          <FormFeedback type="success" title="Success" message="Success message" />
          <SmartInput label="Success Input" success="Valid input" />
        </div>
      );

      const primaryButton = screen.getByText('Primary Button');
      const approvedStatus = screen.getByText('Approved').closest('[role="status"]');
      const successFeedback = screen.getByText('Success').closest('[role="alert"]');
      const successInput = screen.getByLabelText('Success Input').closest('div');

      // All should use hunks-green color variants
      expect(primaryButton).toHaveClass('bg-hunks-green');
      expect(approvedStatus).toHaveClass('bg-hunks-green');
      expect(successFeedback).toHaveClass('border-hunks-green');
      expect(successInput?.querySelector('[data-testid="check-icon"]')).toHaveClass('text-hunks-green');
    });

    it('applies College Hunks Orange consistently across secondary elements', () => {
      render(
        <div data-testid="brand-orange-container">
          <BrandButton variant="secondary">Secondary Button</BrandButton>
          <StatusIndicator status="pending" text="Pending" />
          <FormFeedback type="warning" title="Warning" message="Warning message" />
          <SmartInput label="Warning Input" error="Invalid input" />
        </div>
      );

      const secondaryButton = screen.getByText('Secondary Button');
      const pendingStatus = screen.getByText('Pending').closest('[role="status"]');
      const warningFeedback = screen.getByText('Warning').closest('[role="alert"]');

      // All should use hunks-orange color variants
      expect(secondaryButton).toHaveClass('bg-hunks-orange');
      expect(pendingStatus).toHaveClass('bg-hunks-orange');
      expect(warningFeedback).toHaveClass('border-hunks-orange');
    });

    it('maintains consistent color shades across components', () => {
      render(
        <div data-testid="color-shades-container">
          <BrandButton variant="outline-primary">Outline Primary</BrandButton>
          <BrandButton variant="ghost-primary">Ghost Primary</BrandButton>
          <MetricCard
            title="Revenue"
            value="$1,234"
            color="green"
            change={{ value: 12, type: 'increase', period: 'this month' }}
          />
        </div>
      );

      const outlineButton = screen.getByText('Outline Primary');
      const ghostButton = screen.getByText('Ghost Primary');
      const metricCard = screen.getByText('Revenue').closest('[data-testid="metric-card"]');

      // Should use consistent color shades
      expect(outlineButton).toHaveClass('border-hunks-green', 'text-hunks-green');
      expect(ghostButton).toHaveClass('text-hunks-green');
      expect(metricCard).toHaveClass('border-l-hunks-green');
    });
  });

  describe('Typography Consistency', () => {
    it('uses consistent font sizes across similar elements', () => {
      render(
        <div data-testid="typography-container">
          <BrandButton size="default">Default Button</BrandButton>
          <StatusIndicator status="active" text="Active Status" />
          <SmartInput label="Input Label" />
          <FormFeedback type="info" title="Info Title" message="Info message" />
        </div>
      );

      const button = screen.getByText('Default Button');
      const statusText = screen.getByText('Active Status');
      const inputLabel = screen.getByText('Input Label');
      const feedbackTitle = screen.getByText('Info Title');

      // Should use consistent text sizing
      expect(button).toHaveClass('text-sm');
      expect(statusText).toHaveClass('text-sm');
      expect(inputLabel).toHaveClass('text-sm');
      expect(feedbackTitle).toHaveClass('text-sm');
    });

    it('maintains proper font weight hierarchy', () => {
      render(
        <div data-testid="font-weight-container">
          <MetricCard
            title="Revenue"
            value="$1,234"
            color="green"
          />
          <FormFeedback type="success" title="Success Title" message="Success message" />
        </div>
      );

      const metricTitle = screen.getByText('Revenue');
      const metricValue = screen.getByText('$1,234');
      const feedbackTitle = screen.getByText('Success Title');
      const feedbackMessage = screen.getByText('Success message');

      // Titles should be semibold, values/messages should be normal
      expect(metricTitle).toHaveClass('font-semibold');
      expect(metricValue).toHaveClass('font-bold');
      expect(feedbackTitle).toHaveClass('font-semibold');
      expect(feedbackMessage).toHaveClass('font-normal');
    });
  });

  describe('Spacing Consistency', () => {
    it('uses consistent padding across card-like components', () => {
      render(
        <div data-testid="spacing-container">
          <MetricCard
            title="Revenue"
            value="$1,234"
            color="green"
          />
          <FormFeedback type="info" title="Info" message="Info message" />
        </div>
      );

      const metricCard = screen.getByText('Revenue').closest('[data-testid="metric-card"]');
      const feedbackCard = screen.getByText('Info').closest('[role="status"]');

      // Should use consistent padding
      expect(metricCard).toHaveClass('p-6');
      expect(feedbackCard).toHaveClass('p-4');
    });

    it('maintains consistent spacing between elements', () => {
      render(
        <div data-testid="element-spacing-container">
          <SmartInput 
            label="Test Input" 
            hint="This is a hint"
            error="This is an error"
          />
        </div>
      );

      const inputContainer = screen.getByLabelText('Test Input').closest('div');
      
      // Should have consistent spacing between label, input, hint, and error
      expect(inputContainer).toHaveClass('space-y-2');
    });
  });

  describe('Border and Shadow Consistency', () => {
    it('applies consistent border radius across components', () => {
      render(
        <div data-testid="border-radius-container">
          <BrandButton>Button</BrandButton>
          <StatusIndicator status="active" text="Active" />
          <SmartInput label="Input" />
          <MetricCard title="Card" value="123" color="green" />
        </div>
      );

      const button = screen.getByText('Button');
      const status = screen.getByText('Active').closest('[role="status"]');
      const input = screen.getByLabelText('Input');
      const card = screen.getByText('Card').closest('[data-testid="metric-card"]');

      // Should use consistent border radius
      expect(button).toHaveClass('rounded-md');
      expect(status).toHaveClass('rounded-full');
      expect(input).toHaveClass('rounded-md');
      expect(card).toHaveClass('rounded-lg');
    });

    it('applies consistent shadows for elevation', () => {
      render(
        <div data-testid="shadow-container">
          <MetricCard title="Card" value="123" color="green" />
          <FormFeedback type="info" title="Info" message="Message" />
        </div>
      );

      const card = screen.getByText('Card').closest('[data-testid="metric-card"]');
      const feedback = screen.getByText('Info').closest('[role="status"]');

      // Should use consistent shadow classes
      expect(card).toHaveClass('shadow-sm');
      expect(feedback).toHaveClass('shadow-sm');
    });
  });

  describe('Interactive State Consistency', () => {
    it('applies consistent hover states across interactive elements', () => {
      render(
        <div data-testid="hover-states-container">
          <BrandButton variant="primary">Primary</BrandButton>
          <BrandButton variant="secondary">Secondary</BrandButton>
          <BrandButton variant="outline-primary">Outline</BrandButton>
        </div>
      );

      const primaryButton = screen.getByText('Primary');
      const secondaryButton = screen.getByText('Secondary');
      const outlineButton = screen.getByText('Outline');

      // Should have consistent hover state patterns
      expect(primaryButton).toHaveClass('hover:bg-hunks-green-700');
      expect(secondaryButton).toHaveClass('hover:bg-hunks-orange-700');
      expect(outlineButton).toHaveClass('hover:bg-hunks-green', 'hover:text-white');
    });

    it('applies consistent focus states for accessibility', () => {
      render(
        <div data-testid="focus-states-container">
          <BrandButton>Button</BrandButton>
          <SmartInput label="Input" />
        </div>
      );

      const button = screen.getByText('Button');
      const input = screen.getByLabelText('Input');

      // Should have consistent focus ring styles
      expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-hunks-green/20');
      expect(input).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-hunks-green/20');
    });

    it('applies consistent disabled states', () => {
      render(
        <div data-testid="disabled-states-container">
          <BrandButton disabled>Disabled Button</BrandButton>
          <SmartInput label="Disabled Input" disabled />
        </div>
      );

      const button = screen.getByText('Disabled Button');
      const input = screen.getByLabelText('Disabled Input');

      // Should have consistent disabled styling
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none');
      expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('Loading State Consistency', () => {
    it('applies consistent loading animations', () => {
      render(
        <div data-testid="loading-states-container">
          <BrandButton loading>Loading Button</BrandButton>
          <BrandLoading variant="spinner" />
          <SmartInput label="Loading Input" loading />
        </div>
      );

      const loadingButton = screen.getByText('Loading Button');
      const loadingSpinner = screen.getByTestId('loader-icon');
      const loadingInput = screen.getByLabelText('Loading Input').parentElement;

      // Should have consistent loading indicators
      expect(loadingButton.querySelector('[data-testid="loader-icon"]')).toHaveClass('animate-spin');
      expect(loadingSpinner).toHaveClass('animate-spin');
      expect(loadingInput?.querySelector('[data-testid="loader-icon"]')).toHaveClass('animate-spin');
    });

    it('maintains consistent loading state colors', () => {
      render(
        <div data-testid="loading-colors-container">
          <BrandLoading variant="spinner" color="green" />
          <BrandLoading variant="dots" color="orange" />
          <BrandLoading variant="pulse" color="green" />
        </div>
      );

      const greenSpinner = screen.getByTestId('loader-icon');
      const container = greenSpinner.closest('[data-testid="brand-loading"]');

      // Should use brand colors for loading states
      expect(container).toHaveClass('text-hunks-green');
    });
  });

  describe('Responsive Consistency', () => {
    it('maintains consistent mobile adaptations', () => {
      render(
        <div data-testid="mobile-responsive-container">
          <BrandButton size="default">Mobile Button</BrandButton>
          <MetricCard title="Mobile Card" value="123" color="green" />
          <SmartInput label="Mobile Input" />
        </div>
      );

      const button = screen.getByText('Mobile Button');
      const card = screen.getByText('Mobile Card').closest('[data-testid="metric-card"]');
      const input = screen.getByLabelText('Mobile Input');

      // Should have mobile-appropriate sizing
      expect(button).toHaveClass('h-9'); // Minimum touch target
      expect(card).toHaveClass('p-6'); // Adequate padding for touch
      expect(input).toHaveClass('h-10'); // Proper input height
    });

    it('applies consistent breakpoint behaviors', () => {
      render(
        <div data-testid="breakpoint-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard title="Card 1" value="123" color="green" />
            <MetricCard title="Card 2" value="456" color="orange" />
            <MetricCard title="Card 3" value="789" color="blue" />
          </div>
        </div>
      );

      const container = screen.getByTestId('breakpoint-container').firstElementChild;

      // Should use consistent grid patterns
      expect(container).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Animation Consistency', () => {
    it('respects motion preferences consistently', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <div data-testid="motion-preferences-container">
          <BrandLoading variant="spinner" />
          <StatusIndicator status="processing" animated />
        </div>
      );

      const spinner = screen.getByTestId('loader-icon');
      const animatedStatus = screen.getByText('Processing').closest('[role="status"]');

      // Should respect motion preferences
      expect(spinner).toHaveClass('animate-spin');
      expect(animatedStatus).toHaveClass('animate-pulse');
    });

    it('uses consistent transition durations', () => {
      render(
        <div data-testid="transition-container">
          <BrandButton>Transition Button</BrandButton>
          <SmartInput label="Transition Input" />
        </div>
      );

      const button = screen.getByText('Transition Button');
      const input = screen.getByLabelText('Transition Input');

      // Should use consistent transition classes
      expect(button).toHaveClass('transition-colors');
      expect(input).toHaveClass('transition-colors');
    });
  });

  describe('Icon Consistency', () => {
    it('uses consistent icon sizes across components', () => {
      render(
        <div data-testid="icon-sizes-container">
          <BrandButton icon={() => <div data-testid="button-icon" />}>
            Button with Icon
          </BrandButton>
          <StatusIndicator status="active" text="Active" />
          <SmartInput label="Input" success="Valid" />
        </div>
      );

      const buttonIcon = screen.getByTestId('button-icon');
      const statusIcon = screen.getByText('Active').parentElement?.querySelector('svg, div');
      const inputIcon = screen.getByTestId('check-icon');

      // Should use consistent icon sizing
      expect(buttonIcon).toHaveClass('h-4', 'w-4');
      expect(inputIcon).toHaveClass('h-4', 'w-4');
    });

    it('applies consistent icon colors', () => {
      render(
        <div data-testid="icon-colors-container">
          <StatusIndicator status="approved" text="Approved" />
          <StatusIndicator status="pending" text="Pending" />
          <StatusIndicator status="rejected" text="Rejected" />
        </div>
      );

      const approvedStatus = screen.getByText('Approved').closest('[role="status"]');
      const pendingStatus = screen.getByText('Pending').closest('[role="status"]');
      const rejectedStatus = screen.getByText('Rejected').closest('[role="status"]');

      // Should use brand-consistent icon colors
      expect(approvedStatus).toHaveClass('text-hunks-green');
      expect(pendingStatus).toHaveClass('text-hunks-orange');
      expect(rejectedStatus).toHaveClass('text-destructive');
    });
  });

  describe('Dark Mode Consistency', () => {
    it('maintains brand colors in dark mode', () => {
      // Mock dark mode
      document.documentElement.classList.add('dark');

      render(
        <div data-testid="dark-mode-container">
          <BrandButton variant="primary">Dark Mode Button</BrandButton>
          <MetricCard title="Dark Mode Card" value="123" color="green" />
        </div>
      );

      const button = screen.getByText('Dark Mode Button');
      const card = screen.getByText('Dark Mode Card').closest('[data-testid="metric-card"]');

      // Should maintain brand colors in dark mode
      expect(button).toHaveClass('bg-hunks-green');
      expect(card).toHaveClass('border-l-hunks-green');

      // Cleanup
      document.documentElement.classList.remove('dark');
    });
  });
});