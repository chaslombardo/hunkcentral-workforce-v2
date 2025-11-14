/**
 * Screen Reader Accessibility Tests
 *
 * Tests for screen reader compatibility including ARIA labels, live regions,
 * semantic markup, and announcements for dynamic content changes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Import components to test
import { BrandButton } from '@/components/brand/brand-button';
import { BrandLoading } from '@/components/brand/brand-loading';
import { MetricCard } from '@/components/brand/metric-card';
import { StatusIndicator } from '@/components/brand/status-indicator';
import { SmartInput } from '@/components/forms/smart-input';
import { FormFeedback } from '@/components/forms/form-feedback';
import {
  AccessibilityAnnouncer,
  useAnnouncer,
} from '@/components/ui/accessibility-announcer';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  TrendingUp: ({ className }: { className?: string }) => (
    <div data-testid="trending-up-icon" className={className} />
  ),
  TrendingDown: ({ className }: { className?: string }) => (
    <div data-testid="trending-down-icon" className={className} />
  ),
  DollarSign: ({ className }: { className?: string }) => (
    <div data-testid="dollar-icon" className={className} />
  ),
  CheckCircle2: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="warning-icon" className={className} />
  ),
  Info: ({ className }: { className?: string }) => (
    <div data-testid="info-icon" className={className} />
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
}));

describe('Screen Reader Accessibility Tests', () => {
  const user = userEvent.setup();

  describe('ARIA Labels and Descriptions', () => {
    it('provides comprehensive ARIA labels for buttons', () => {
      render(
        <div>
          <BrandButton aria-label="Save document">Save</BrandButton>
          <BrandButton loading loadingText="Saving document">
            Save
          </BrandButton>
          <BrandButton disabled>Disabled Button</BrandButton>
        </div>
      );

      const saveButton = screen.getByLabelText('Save document');
      expect(saveButton).toBeInTheDocument();

      const loadingButton = screen.getByLabelText('Saving document');
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');

      const disabledButton = screen.getByText('Disabled Button');
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('provides descriptive ARIA labels for metric cards', () => {
      render(
        <MetricCard
          title="Monthly Revenue"
          value="$12,345"
          change={{ value: 15, type: 'increase', period: 'this month' }}
          color="green"
        />
      );

      const card = screen.getByRole('generic');
      expect(card).toHaveAttribute('aria-label');

      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('Monthly Revenue');
      expect(ariaLabel).toContain('$12,345');
      expect(ariaLabel).toContain('15% increase');
      expect(ariaLabel).toContain('this month');
    });

    it('provides proper status announcements', () => {
      render(
        <div>
          <StatusIndicator status="approved" text="Document approved" />
          <StatusIndicator status="pending" text="Awaiting review" animated />
          <StatusIndicator status="rejected" text="Needs revision" />
        </div>
      );

      const approvedStatus = screen.getByRole('status', { name: /approved/i });
      expect(approvedStatus).toHaveAttribute(
        'aria-label',
        'Status: Document approved'
      );

      const pendingStatus = screen.getByRole('status', { name: /pending/i });
      expect(pendingStatus).toHaveAttribute('aria-live', 'polite');
      expect(pendingStatus).toHaveAttribute('aria-atomic', 'true');

      const rejectedStatus = screen.getByRole('status', { name: /rejected/i });
      expect(rejectedStatus).toHaveAttribute(
        'aria-label',
        'Status: Needs revision'
      );
    });

    it('associates form inputs with labels and descriptions', () => {
      render(
        <SmartInput
          label="Email Address"
          hint="Enter your work email address"
          error="Please enter a valid email"
          success="Email format is valid"
        />
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-describedby');

      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('hint');
      expect(describedBy).toContain('error');

      expect(input).toHaveAttribute('aria-invalid', 'true');

      // Check that hint and error are properly associated
      expect(screen.getByText('Enter your work email address')).toHaveAttribute(
        'id'
      );
      expect(screen.getByText('Please enter a valid email')).toHaveAttribute(
        'id'
      );
    });

    it('provides proper form feedback announcements', () => {
      render(
        <div>
          <FormFeedback
            type="success"
            title="Form Submitted"
            message="Your form has been submitted successfully."
          />
          <FormFeedback
            type="error"
            title="Validation Error"
            message="Please fix the following errors:"
            suggestions={['Check required fields', 'Verify email format']}
          />
        </div>
      );

      const successFeedback = screen.getByRole('alert');
      expect(successFeedback).toHaveAttribute('aria-live', 'assertive');
      expect(successFeedback).toHaveAttribute('aria-atomic', 'true');

      const errorFeedback = screen.getByRole('alert');
      expect(errorFeedback).toHaveAttribute('aria-live', 'assertive');

      // Suggestions should be in a list for screen readers
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });

  describe('Live Regions and Dynamic Content', () => {
    it('announces loading state changes', () => {
      const { rerender } = render(
        <BrandLoading text="Loading data" announceChanges />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveAttribute('aria-atomic', 'true');
      expect(screen.getByText('Loading data, please wait')).toBeInTheDocument();

      // Change loading text
      rerender(<BrandLoading text="Processing request" announceChanges />);
      expect(
        screen.getByText('Processing request, please wait')
      ).toBeInTheDocument();
    });

    it('announces form validation changes', async () => {
      render(
        <SmartInput
          label="Required Field"
          validationRules={[
            {
              test: (value) => value.length > 0,
              message: 'This field is required',
              type: 'error',
              priority: 1,
            },
          ]}
          validateOnBlur={true}
          announceValidation={true}
        />
      );

      const input = screen.getByLabelText('Required Field');

      // Trigger validation error
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      // Error should be in a live region
      const errorElement = screen.getByText('This field is required');
      expect(errorElement.closest('[aria-live]')).toBeInTheDocument();
    });

    it('announces status changes with proper timing', async () => {
      const TestComponent = () => {
        const [status, setStatus] = React.useState<
          'idle' | 'processing' | 'complete'
        >('idle');

        const handleProcess = () => {
          setStatus('processing');
          setTimeout(() => setStatus('complete'), 100);
        };

        return (
          <div>
            <BrandButton onClick={handleProcess}>Start Process</BrandButton>
            <StatusIndicator
              status={
                status === 'processing'
                  ? 'pending'
                  : status === 'complete'
                    ? 'approved'
                    : 'draft'
              }
              text={
                status === 'processing'
                  ? 'Processing...'
                  : status === 'complete'
                    ? 'Complete'
                    : 'Ready'
              }
              animated={status === 'processing'}
            />
          </div>
        );
      };

      render(<TestComponent />);

      const button = screen.getByText('Start Process');
      await user.click(button);

      // Should announce processing state
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });

      // Should announce completion
      await waitFor(
        () => {
          expect(screen.getByText('Complete')).toBeInTheDocument();
        },
        { timeout: 200 }
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('uses accessibility announcer for custom announcements', async () => {
      const TestComponent = () => {
        const { announce } = useAnnouncer();

        return (
          <BrandButton
            onClick={() => announce('Custom announcement', 'assertive')}
          >
            Make Announcement
          </BrandButton>
        );
      };

      render(
        <AccessibilityAnnouncer>
          <TestComponent />
        </AccessibilityAnnouncer>
      );

      const button = screen.getByText('Make Announcement');
      await user.click(button);

      // Check that live regions are created
      const assertiveLiveRegion = document.getElementById(
        'global-announcer-assertive'
      );
      expect(assertiveLiveRegion).toBeInTheDocument();
      expect(assertiveLiveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(assertiveLiveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Semantic Markup', () => {
    it('uses proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Page Title</h1>
          <MetricCard title="Revenue" value="$1,234" color="green" />
          <h2>Section Title</h2>
          <FormFeedback
            type="info"
            title="Information"
            message="Info message"
          />
        </div>
      );

      // Check heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Main Page Title'
      );
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Section Title'
      );

      // Metric card title should be properly marked
      const metricTitle = screen.getByText('Revenue');
      expect(metricTitle).toHaveClass('font-semibold'); // Visual hierarchy

      // Feedback title should be properly marked
      const feedbackTitle = screen.getByText('Information');
      expect(feedbackTitle).toHaveClass('font-semibold');
    });

    it('uses proper list markup for related items', () => {
      render(
        <FormFeedback
          type="error"
          title="Validation Errors"
          message="Please fix the following:"
          suggestions={[
            'Fill in all required fields',
            'Use a valid email format',
            'Password must be at least 8 characters',
          ]}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      expect(listItems[0]).toHaveTextContent('Fill in all required fields');
      expect(listItems[1]).toHaveTextContent('Use a valid email format');
      expect(listItems[2]).toHaveTextContent(
        'Password must be at least 8 characters'
      );
    });

    it('uses proper landmark roles', () => {
      render(
        <div>
          <nav aria-label="Main navigation">
            <BrandButton>Home</BrandButton>
            <BrandButton>About</BrandButton>
          </nav>
          <main>
            <h1>Main Content</h1>
            <MetricCard title="Revenue" value="$1,234" color="green" />
          </main>
          <aside aria-label="Sidebar">
            <StatusIndicator status="active" text="System Status" />
          </aside>
        </div>
      );

      expect(
        screen.getByRole('navigation', { name: 'Main navigation' })
      ).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(
        screen.getByRole('complementary', { name: 'Sidebar' })
      ).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('provides proper form structure for screen readers', () => {
      render(
        <form aria-label="Contact Form">
          <fieldset>
            <legend>Personal Information</legend>
            <SmartInput label="First Name" required />
            <SmartInput label="Last Name" required />
          </fieldset>
          <fieldset>
            <legend>Contact Details</legend>
            <SmartInput label="Email" type="email" required />
            <SmartInput label="Phone" type="tel" />
          </fieldset>
          <BrandButton type="submit">Submit Form</BrandButton>
        </form>
      );

      expect(
        screen.getByRole('form', { name: 'Contact Form' })
      ).toBeInTheDocument();

      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets).toHaveLength(2);

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Details')).toBeInTheDocument();

      // Required fields should be marked
      const firstNameInput = screen.getByLabelText('First Name');
      expect(firstNameInput).toHaveAttribute('required');
      expect(firstNameInput).toHaveAttribute('aria-required', 'true');
    });

    it('announces form submission states', async () => {
      const TestForm = () => {
        const [isSubmitting, setIsSubmitting] = React.useState(false);
        const [submitted, setSubmitted] = React.useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitting(true);
          setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
          }, 100);
        };

        return (
          <form onSubmit={handleSubmit}>
            <SmartInput label="Name" />
            <BrandButton type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </BrandButton>
            {submitted && (
              <div role="status" aria-live="polite">
                Form submitted successfully
              </div>
            )}
          </form>
        );
      };

      render(<TestForm />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Should announce submitting state
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });

      // Should announce success
      await waitFor(
        () => {
          expect(
            screen.getByText('Form submitted successfully')
          ).toBeInTheDocument();
        },
        { timeout: 200 }
      );

      const successMessage = screen.getByText('Form submitted successfully');
      expect(successMessage.closest('[aria-live]')).toHaveAttribute(
        'aria-live',
        'polite'
      );
    });
  });

  describe('Interactive Element Descriptions', () => {
    it('provides context for interactive metric cards', () => {
      render(
        <MetricCard
          title="Monthly Revenue"
          value="$12,345"
          change={{ value: 15, type: 'increase', period: 'this month' }}
          color="green"
          interactive={true}
          onCardClick={() => {}}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label');

      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('Click to view details');
      expect(ariaLabel).toContain('Monthly Revenue');
      expect(ariaLabel).toContain('$12,345');
    });

    it('describes button states clearly', () => {
      render(
        <div>
          <BrandButton loading loadingText="Saving changes">
            Save
          </BrandButton>
          <BrandButton disabled>Disabled Action</BrandButton>
        </div>
      );

      const loadingButton = screen.getByLabelText('Saving changes');
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');
      expect(loadingButton).toBeDisabled();

      const disabledButton = screen.getByText('Disabled Action');
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
      expect(disabledButton).toBeDisabled();
    });

    it('provides helpful descriptions for form validation', async () => {
      render(
        <SmartInput
          label="Password"
          type="password"
          hint="Must be at least 8 characters with uppercase, lowercase, and numbers"
          validationRules={[
            {
              test: (value) => value.length >= 8,
              message: 'Password must be at least 8 characters',
              type: 'error',
              priority: 1,
            },
          ]}
          validateOnBlur={true}
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-describedby');

      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('hint');

      // Trigger validation
      await user.type(input, 'short');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 8 characters')
        ).toBeInTheDocument();
      });

      // Error should be associated with input
      const updatedDescribedBy = input.getAttribute('aria-describedby');
      expect(updatedDescribedBy).toContain('error');
    });
  });

  describe('Screen Reader Navigation', () => {
    it('provides skip links for efficient navigation', () => {
      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <a href="#navigation" className="sr-only focus:not-sr-only">
            Skip to navigation
          </a>
          <nav id="navigation">
            <BrandButton>Home</BrandButton>
          </nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('provides proper table markup for data', () => {
      render(
        <table>
          <caption>Monthly Revenue Report</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Revenue</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">January</th>
              <td>$12,345</td>
              <td>+15%</td>
            </tr>
            <tr>
              <th scope="row">February</th>
              <td>$13,456</td>
              <td>+9%</td>
            </tr>
          </tbody>
        </table>
      );

      expect(
        screen.getByRole('table', { name: 'Monthly Revenue Report' })
      ).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
      expect(screen.getAllByRole('rowheader')).toHaveLength(2);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('provides clear error messages for screen readers', () => {
      render(
        <FormFeedback
          type="error"
          title="Form Submission Failed"
          message="There was an error submitting your form. Please try again."
          onRetry={() => {}}
          suggestions={[
            'Check your internet connection',
            'Verify all required fields are filled',
            'Contact support if the problem persists',
          ]}
        />
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');

      // Should have retry button with clear label
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toHaveAttribute(
        'aria-label',
        'Retry form submission'
      );

      // Suggestions should be in accessible list
      const suggestionsList = screen.getByRole('list');
      expect(suggestionsList).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('announces successful recovery from errors', async () => {
      const TestComponent = () => {
        const [hasError, setHasError] = React.useState(true);

        return (
          <div>
            <BrandButton onClick={() => setHasError(false)}>
              Resolve Error
            </BrandButton>
            {hasError ? (
              <div role="alert" aria-live="assertive">
                Error: Something went wrong
              </div>
            ) : (
              <div role="status" aria-live="polite">
                Success: Error has been resolved
              </div>
            )}
          </div>
        );
      };

      render(<TestComponent />);

      expect(
        screen.getByText('Error: Something went wrong')
      ).toBeInTheDocument();

      const resolveButton = screen.getByText('Resolve Error');
      await user.click(resolveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Success: Error has been resolved')
        ).toBeInTheDocument();
      });

      const successMessage = screen.getByText(
        'Success: Error has been resolved'
      );
      expect(successMessage.closest('[aria-live]')).toHaveAttribute(
        'aria-live',
        'polite'
      );
    });
  });
});
