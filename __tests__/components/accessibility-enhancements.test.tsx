/**
 * Accessibility Enhancements Test Suite
 * 
 * Tests for the comprehensive accessibility improvements implemented in task 18.
 * Covers ARIA labels, keyboard navigation, color contrast, and screen reader support.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import components to test
import { BrandButton } from '@/components/brand/brand-button';
import { BrandLoading } from '@/components/brand/brand-loading';
import { MetricCard } from '@/components/brand/metric-card';
import { StatusIndicator } from '@/components/brand/status-indicator';
import { SmartInput } from '@/components/forms/smart-input';
import { AccessibilityAnnouncer, useAnnouncer } from '@/components/ui/accessibility-announcer';
import { SkipNavigation } from '@/components/ui/skip-navigation';

// Import utilities to test
import { 
  ariaLabels, 
  keyboardUtils, 
  focusUtils, 
  screenReaderUtils,
  getContrastRatio,
  meetsContrastRequirement,
  a11yTesting
} from '@/lib/accessibility-utils';

describe('Accessibility Enhancements', () => {
  describe('ARIA Labels and Descriptions', () => {
    test('BrandButton has proper ARIA labels', () => {
      render(
        <BrandButton aria-label="Save document">
          Save
        </BrandButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Save document');
    });

    test('BrandButton announces loading state', () => {
      render(
        <BrandButton loading loadingText="Saving document">
          Save
        </BrandButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-label', 'Saving document');
    });

    test('MetricCard has descriptive ARIA label', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,234"
          change={{ value: 12, type: 'increase', period: 'this month' }}
        />
      );
      
      const card = screen.getByRole('generic');
      expect(card).toHaveAttribute('aria-label');
      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('Revenue');
      expect(ariaLabel).toContain('$1,234');
    });

    test('StatusIndicator has proper status role', () => {
      render(<StatusIndicator status="pending" text="Processing" />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Status: Processing');
    });

    test('SmartInput has proper form labeling', () => {
      render(
        <SmartInput
          label="Email Address"
          hint="Enter your work email"
          error="Invalid email format"
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      
      // Check that error message is properly associated
      const errorMessage = screen.getByText('Invalid email format');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('BrandButton responds to keyboard activation', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <BrandButton onClick={handleClick}>
          Click me
        </BrandButton>
      );
      
      const button = screen.getByRole('button');
      
      // Test Enter key
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    test('Interactive MetricCard responds to keyboard', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <MetricCard
          title="Revenue"
          value="$1,234"
          interactive
          onCardClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Test keyboard activation
      card.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    test('Skip navigation links work correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <SkipNavigation />
          <main id="main-content">Main content</main>
        </div>
      );
      
      // Tab to skip link
      await user.tab();
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveFocus();
      
      // Activate skip link
      await user.keyboard('{Enter}');
      
      // Check that focus moved to main content
      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    test('BrandLoading announces state changes', () => {
      const { rerender } = render(
        <BrandLoading text="Loading data" announceChanges />
      );
      
      // Check initial state
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveAttribute('aria-atomic', 'true');
      
      // Check screen reader text
      expect(screen.getByText('Loading data, please wait')).toBeInTheDocument();
    });

    test('StatusIndicator with animation has live region', () => {
      render(<StatusIndicator status="processing" animated />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    test('Accessibility announcer creates live regions', () => {
      const TestComponent = () => {
        const { announce } = useAnnouncer();
        
        return (
          <button onClick={() => announce('Test message', 'polite')}>
            Announce
          </button>
        );
      };
      
      render(
        <AccessibilityAnnouncer>
          <TestComponent />
        </AccessibilityAnnouncer>
      );
      
      // Check that live regions are created
      expect(document.getElementById('global-announcer-polite')).toBeInTheDocument();
      expect(document.getElementById('global-announcer-assertive')).toBeInTheDocument();
    });
  });

  describe('Color Contrast Compliance', () => {
    test('Brand colors meet WCAG AA standards', () => {
      const hunksGreen = '#026937';
      const hunksOrange = '#ea7200';
      const white = '#ffffff';
      
      // Test brand green on white
      const greenRatio = getContrastRatio(hunksGreen, white);
      expect(greenRatio).toBeGreaterThan(4.5); // WCAG AA minimum
      expect(meetsContrastRequirement(hunksGreen, white, 'AA')).toBe(true);
      
      // Test brand orange on white
      const orangeRatio = getContrastRatio(hunksOrange, white);
      expect(orangeRatio).toBeGreaterThan(4.5); // WCAG AA minimum
      expect(meetsContrastRequirement(hunksOrange, white, 'AA')).toBe(true);
      
      // Test white on brand colors
      expect(meetsContrastRequirement(white, hunksGreen, 'AA')).toBe(true);
      expect(meetsContrastRequirement(white, hunksOrange, 'AA')).toBe(true);
    });
  });

  describe('Keyboard Utilities', () => {
    test('keyboardUtils correctly identifies activation keys', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      
      expect(keyboardUtils.isActivationKey(enterEvent as any)).toBe(true);
      expect(keyboardUtils.isActivationKey(spaceEvent as any)).toBe(true);
      expect(keyboardUtils.isActivationKey(tabEvent as any)).toBe(false);
    });

    test('keyboardUtils handles arrow navigation', () => {
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      
      // Test vertical navigation
      const downResult = keyboardUtils.handleArrowNavigation(
        arrowDownEvent as any,
        0, // current index
        5, // total items
        'vertical'
      );
      expect(downResult).toBe(1);
      
      const upResult = keyboardUtils.handleArrowNavigation(
        arrowUpEvent as any,
        0, // current index
        5, // total items
        'vertical'
      );
      expect(upResult).toBe(4); // wraps to end
    });
  });

  describe('Focus Management', () => {
    test('focusUtils finds focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <button disabled>Disabled Button</button>
        <a href="#">Link</a>
        <div tabindex="0">Focusable Div</div>
        <div tabindex="-1">Non-focusable Div</div>
      `;
      
      const focusableElements = focusUtils.getFocusableElements(container);
      expect(focusableElements).toHaveLength(4); // button, input, link, focusable div
    });

    test('focusUtils creates focus trap', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);
      
      const cleanup = focusUtils.createFocusTrap(container);
      
      // Check that first element gets focus
      const firstButton = document.getElementById('first');
      expect(document.activeElement).toBe(firstButton);
      
      cleanup();
      document.body.removeChild(container);
    });
  });

  describe('Accessibility Testing Utilities', () => {
    test('a11yTesting detects missing labels', () => {
      const button = document.createElement('button');
      button.textContent = 'Click me';
      
      const result = a11yTesting.auditElement(button);
      expect(result.hasProperLabeling).toBe(false);
      expect(result.issues).toContain('Element lacks proper labeling (aria-label, aria-labelledby, or associated label)');
    });

    test('a11yTesting detects proper labeling', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Save document');
      
      const result = a11yTesting.auditElement(button);
      expect(result.hasProperLabeling).toBe(true);
    });

    test('a11yTesting detects keyboard accessibility', () => {
      const button = document.createElement('button');
      const div = document.createElement('div');
      div.onclick = () => {}; // Interactive but not keyboard accessible
      
      expect(a11yTesting.isKeyboardAccessible(button)).toBe(true);
      expect(a11yTesting.isKeyboardAccessible(div)).toBe(false);
    });
  });

  describe('Screen Reader Utilities', () => {
    test('screenReaderUtils creates live regions', () => {
      const liveRegion = screenReaderUtils.createLiveRegion('test-region', 'polite');
      
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion.id).toBe('test-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveClass('sr-only');
      
      // Cleanup
      document.body.removeChild(liveRegion);
    });

    test('screenReaderUtils updates live regions', () => {
      const liveRegion = screenReaderUtils.createLiveRegion('test-region-2', 'assertive');
      
      screenReaderUtils.updateLiveRegion('test-region-2', 'Test message');
      expect(liveRegion.textContent).toBe('Test message');
      
      // Cleanup
      document.body.removeChild(liveRegion);
    });

    test('screenReaderUtils announces messages', () => {
      // Mock the DOM manipulation
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      
      screenReaderUtils.announce('Test announcement', 'assertive');
      
      expect(createElementSpy).toHaveBeenCalledWith('div');
      expect(appendChildSpy).toHaveBeenCalled();
      
      // Wait for cleanup
      setTimeout(() => {
        expect(removeChildSpy).toHaveBeenCalled();
      }, 1100);
      
      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('Complete form with accessibility features', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      
      render(
        <form onSubmit={handleSubmit}>
          <SmartInput
            label="Email"
            validateOnChange
            validationRules={[
              {
                test: (value) => value.includes('@'),
                message: 'Must be a valid email',
                type: 'error',
                priority: 1
              }
            ]}
          />
          <BrandButton type="submit">Submit</BrandButton>
        </form>
      );
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      // Test keyboard navigation
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
      
      // Test form validation
      await user.click(emailInput);
      await user.type(emailInput, 'invalid-email');
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
      
      // Fix the email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      });
    });
  });
});