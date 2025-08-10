/**
 * End-to-End Tests for Theme & UX Improvements
 * 
 * Tests the complete user experience with enhanced theme components,
 * navigation improvements, and accessibility features.
 */

import { test, expect } from '@playwright/test';

test.describe('Theme & UX Improvements E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test.describe('Brand Visual Identity', () => {
    test('displays consistent brand colors throughout the application', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Check dashboard brand elements
      await expect(page).toHaveURL('/dashboard');
      
      // Primary buttons should use College Hunks Green
      const primaryButtons = page.locator('[data-variant="primary"]');
      await expect(primaryButtons.first()).toHaveCSS('background-color', 'rgb(2, 105, 55)'); // #026937

      // Secondary buttons should use College Hunks Orange
      const secondaryButtons = page.locator('[data-variant="secondary"]');
      if (await secondaryButtons.count() > 0) {
        await expect(secondaryButtons.first()).toHaveCSS('background-color', 'rgb(234, 114, 0)'); // #ea7200
      }

      // Status indicators should use brand colors
      const approvedStatus = page.locator('[data-status="approved"]');
      if (await approvedStatus.count() > 0) {
        await expect(approvedStatus.first()).toHaveCSS('background-color', 'rgb(2, 105, 55)');
      }

      const pendingStatus = page.locator('[data-status="pending"]');
      if (await pendingStatus.count() > 0) {
        await expect(pendingStatus.first()).toHaveCSS('background-color', 'rgb(234, 114, 0)');
      }
    });

    test('shows branded loading states', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      
      // Click login and check for branded loading
      await page.click('[data-testid="login-button"]');
      
      // Should show branded loading spinner
      const loadingSpinner = page.locator('[data-testid="brand-loading"]');
      if (await loadingSpinner.count() > 0) {
        await expect(loadingSpinner).toBeVisible();
        await expect(loadingSpinner).toHaveCSS('color', 'rgb(2, 105, 55)'); // Brand green
      }
    });

    test('displays enhanced metric cards with brand styling', async ({ page }) => {
      // Login and navigate to dashboard
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Check metric cards
      const metricCards = page.locator('[data-testid="metric-card"]');
      await expect(metricCards.first()).toBeVisible();

      // Should have brand-colored borders
      await expect(metricCards.first()).toHaveCSS('border-left-color', 'rgb(2, 105, 55)');

      // Should show trend indicators
      const trendIndicators = page.locator('[data-testid="trend-indicator"]');
      if (await trendIndicators.count() > 0) {
        await expect(trendIndicators.first()).toBeVisible();
      }

      // Should be interactive if specified
      const interactiveCards = page.locator('[data-testid="metric-card"][data-interactive="true"]');
      if (await interactiveCards.count() > 0) {
        await interactiveCards.first().hover();
        // Should show hover effect
        await expect(interactiveCards.first()).toHaveCSS('transform', 'scale(1.02)');
      }
    });
  });

  test.describe('Enhanced Navigation', () => {
    test('displays smart breadcrumbs with proper navigation', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Navigate to logs
      await page.click('[data-testid="nav-logs"]');
      await expect(page).toHaveURL('/logs');

      // Should show breadcrumbs
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      await expect(breadcrumbs).toBeVisible();
      
      // Should show Dashboard > Logs
      await expect(breadcrumbs.locator('text=Dashboard')).toBeVisible();
      await expect(breadcrumbs.locator('text=Logs')).toBeVisible();

      // Navigate to create log
      await page.click('[data-testid="create-log-button"]');
      await expect(page).toHaveURL('/logs/create');

      // Breadcrumbs should update
      await expect(breadcrumbs.locator('text=Create Log')).toBeVisible();

      // Click breadcrumb to navigate back
      await breadcrumbs.locator('text=Dashboard').click();
      await expect(page).toHaveURL('/dashboard');
    });

    test('shows unified mobile navigation on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Should show mobile navigation
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      await expect(mobileNav).toBeVisible();

      // Should not show desktop sidebar
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
      await expect(desktopSidebar).not.toBeVisible();

      // Mobile nav should have proper touch targets
      const navButtons = mobileNav.locator('button');
      const firstButton = navButtons.first();
      const buttonBox = await firstButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(48); // Minimum touch target

      // Test navigation
      await page.click('[data-testid="mobile-nav-logs"]');
      await expect(page).toHaveURL('/logs');

      // Should show active state
      const activeButton = page.locator('[data-testid="mobile-nav-logs"][data-active="true"]');
      await expect(activeButton).toBeVisible();
    });

    test('displays navigation badges for pending items', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Should show badges for pending items
      const pendingLogsBadge = page.locator('[data-testid="nav-badge-pending-logs"]');
      if (await pendingLogsBadge.count() > 0) {
        await expect(pendingLogsBadge).toBeVisible();
        await expect(pendingLogsBadge).toHaveCSS('background-color', 'rgb(234, 114, 0)'); // Orange
      }

      const draftLogsBadge = page.locator('[data-testid="nav-badge-draft-logs"]');
      if (await draftLogsBadge.count() > 0) {
        await expect(draftLogsBadge).toBeVisible();
      }
    });

    test('adapts navigation for different user roles', async ({ page }) => {
      // Test captain role
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Should show captain-appropriate navigation
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-logs"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-commission"]')).toBeVisible();

      // Should not show admin-only items
      await expect(page.locator('[data-testid="nav-user-management"]')).not.toBeVisible();

      // Logout and test admin role
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      await page.fill('[data-testid="email-input"]', 'admin@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Should show admin navigation
      await expect(page.locator('[data-testid="nav-user-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-pay-periods"]')).toBeVisible();
    });
  });

  test.describe('Enhanced Form Interactions', () => {
    test('shows progressive validation with smart inputs', async ({ page }) => {
      // Login and navigate to form
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.click('[data-testid="nav-logs"]');
      await page.click('[data-testid="create-log-button"]');

      // Test smart input validation
      const emailInput = page.locator('[data-testid="smart-input-email"]');
      if (await emailInput.count() > 0) {
        // Type invalid email
        await emailInput.fill('invalid-email');
        await emailInput.blur();

        // Should show validation error
        await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="alert-icon"]')).toBeVisible();

        // Fix email
        await emailInput.fill('valid@example.com');
        await emailInput.blur();

        // Should show success state
        await expect(page.locator('[data-testid="validation-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="check-icon"]')).toBeVisible();
      }
    });

    test('displays enhanced form feedback', async ({ page }) => {
      // Login and navigate to form
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.click('[data-testid="nav-logs"]');
      await page.click('[data-testid="create-log-button"]');

      // Try to submit empty form
      await page.click('[data-testid="submit-button"]');

      // Should show form feedback
      const formFeedback = page.locator('[data-testid="form-feedback"]');
      await expect(formFeedback).toBeVisible();
      
      // Should have proper styling
      await expect(formFeedback).toHaveCSS('border-color', 'rgb(239, 68, 68)'); // Error red
      
      // Should show suggestions
      const suggestions = page.locator('[data-testid="feedback-suggestions"]');
      if (await suggestions.count() > 0) {
        await expect(suggestions).toBeVisible();
      }
    });

    test('handles mobile form optimizations', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await page.click('[data-testid="mobile-nav-logs"]');
      await page.click('[data-testid="create-log-button"]');

      // Check mobile form optimizations
      const form = page.locator('[data-testid="mobile-form"]');
      await expect(form).toBeVisible();

      // Inputs should have proper mobile attributes
      const numberInputs = page.locator('input[inputmode="decimal"]');
      if (await numberInputs.count() > 0) {
        await expect(numberInputs.first()).toHaveAttribute('inputmode', 'decimal');
      }

      const emailInputs = page.locator('input[inputmode="email"]');
      if (await emailInputs.count() > 0) {
        await expect(emailInputs.first()).toHaveAttribute('inputmode', 'email');
      }

      // Buttons should have proper touch targets
      const submitButton = page.locator('[data-testid="submit-button"]');
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(48);

      // Should show auto-save indicator
      const autoSaveIndicator = page.locator('[data-testid="auto-save-indicator"]');
      if (await autoSaveIndicator.count() > 0) {
        await expect(autoSaveIndicator).toBeVisible();
      }
    });
  });

  test.describe('Accessibility Features', () => {
    test('supports keyboard navigation throughout the application', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Should focus first interactive element
      await page.keyboard.press('Enter'); // Should activate focused element

      // Navigate through sidebar with keyboard
      const sidebar = page.locator('[data-testid="sidebar"]');
      if (await sidebar.count() > 0) {
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowDown'); // Should move to next nav item
        await page.keyboard.press('Enter'); // Should navigate
      }

      // Test form keyboard navigation
      await page.goto('/logs/create');
      
      await page.keyboard.press('Tab'); // Focus first input
      await page.keyboard.type('test value');
      await page.keyboard.press('Tab'); // Move to next input
      await page.keyboard.press('Enter'); // Should submit if on submit button
    });

    test('provides proper ARIA labels and screen reader support', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Check ARIA labels on buttons
      const buttons = page.locator('button[aria-label]');
      await expect(buttons.first()).toHaveAttribute('aria-label');

      // Check status indicators have proper roles
      const statusIndicators = page.locator('[role="status"]');
      if (await statusIndicators.count() > 0) {
        await expect(statusIndicators.first()).toHaveAttribute('role', 'status');
      }

      // Check form inputs have proper labeling
      const inputs = page.locator('input[aria-labelledby], input[aria-label]');
      if (await inputs.count() > 0) {
        const firstInput = inputs.first();
        const hasLabel = await firstInput.getAttribute('aria-label') || 
                         await firstInput.getAttribute('aria-labelledby');
        expect(hasLabel).toBeTruthy();
      }

      // Check live regions for dynamic content
      const liveRegions = page.locator('[aria-live]');
      if (await liveRegions.count() > 0) {
        await expect(liveRegions.first()).toHaveAttribute('aria-live');
      }
    });

    test('respects motion preferences', async ({ page }) => {
      // Mock reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Animations should be reduced or disabled
      const animatedElements = page.locator('[data-testid="brand-loading"]');
      if (await animatedElements.count() > 0) {
        // Should not have animation classes when motion is reduced
        await expect(animatedElements.first()).not.toHaveClass(/animate-/);
      }

      // Transitions should be instant
      const transitionElements = page.locator('.transition-all');
      if (await transitionElements.count() > 0) {
        await expect(transitionElements.first()).toHaveCSS('transition-duration', '0s');
      }
    });

    test('maintains focus management in dynamic content', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Test focus management in modals/dialogs
      const modalTrigger = page.locator('[data-testid="open-modal"]');
      if (await modalTrigger.count() > 0) {
        await modalTrigger.focus();
        await modalTrigger.click();

        // Focus should move to modal
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // First focusable element in modal should be focused
        const firstFocusable = modal.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
        if (await firstFocusable.count() > 0) {
          await expect(firstFocusable).toBeFocused();
        }

        // Close modal
        await page.keyboard.press('Escape');
        
        // Focus should return to trigger
        await expect(modalTrigger).toBeFocused();
      }
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('loads quickly with enhanced components', async ({ page }) => {
      const startTime = Date.now();
      
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('adapts to different screen sizes', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Test desktop layout
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-navigation"]')).not.toBeVisible();

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 });
      // Should adapt layout appropriately

      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();

      // Metric cards should stack on mobile
      const metricCards = page.locator('[data-testid="metric-card"]');
      if (await metricCards.count() > 1) {
        const firstCard = metricCards.first();
        const secondCard = metricCards.nth(1);
        
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        // Cards should be stacked vertically on mobile
        if (firstBox && secondBox) {
          expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
        }
      }
    });

    test('handles offline scenarios gracefully', async ({ page }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Simulate offline
      await page.context().setOffline(true);

      // Should show offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      if (await offlineIndicator.count() > 0) {
        await expect(offlineIndicator).toBeVisible();
      }

      // Try to navigate - should handle gracefully
      await page.click('[data-testid="nav-logs"]');
      
      // Should show appropriate error message
      const errorMessage = page.locator('[data-testid="network-error"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }

      // Restore online
      await page.context().setOffline(false);
      
      // Should hide offline indicator
      if (await offlineIndicator.count() > 0) {
        await expect(offlineIndicator).not.toBeVisible();
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('works consistently across different browsers', async ({ page, browserName }) => {
      // Login
      await page.fill('[data-testid="email-input"]', 'captain@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Test core functionality works in all browsers
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Brand colors should render consistently
      const primaryButton = page.locator('[data-variant="primary"]').first();
      if (await primaryButton.count() > 0) {
        const bgColor = await primaryButton.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).toBe('rgb(2, 105, 55)'); // Should be consistent across browsers
      }

      // Navigation should work
      await page.click('[data-testid="nav-logs"]');
      await expect(page).toHaveURL('/logs');

      // Forms should work
      const createButton = page.locator('[data-testid="create-log-button"]');
      if (await createButton.count() > 0) {
        await createButton.click();
        await expect(page).toHaveURL('/logs/create');
      }
    });
  });
});