/**
 * End-to-end tests for captain user journey
 * Tests the complete mobile-first captain workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Captain Mobile Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test('should complete full captain workflow on mobile', async ({ page }) => {
    // Step 1: Login as captain
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Captain');

    // Step 2: Navigate to create log
    await page.click('[data-testid="create-log-button"]');
    await expect(page).toHaveURL('/logs/create');

    // Step 3: Fill out log form
    // Select log date
    await page.click('[data-testid="log-date-picker"]');
    await page.click('[data-testid="date-today"]');

    // Enable junk section
    await page.check('[data-testid="section-junk-checkbox"]');

    // Add first junk job
    await page.click('[data-testid="add-junk-job-button"]');
    
    await page.fill('[data-testid="job-id-input-0"]', 'MOBILE-001');
    await page.fill('[data-testid="client-name-input-0"]', 'Mobile Test Client');
    await page.fill('[data-testid="revenue-input-0"]', '800');
    await page.fill('[data-testid="tips-input-0"]', '80');

    // Add second junk job
    await page.click('[data-testid="add-another-job-button"]');
    
    await page.fill('[data-testid="job-id-input-1"]', 'MOBILE-002');
    await page.fill('[data-testid="client-name-input-1"]', 'Mobile Test Client 2');
    await page.fill('[data-testid="revenue-input-1"]', '600');
    await page.fill('[data-testid="tips-input-1"]', '60');

    // Add disposal cost
    await page.fill('[data-testid="disposal-cost-input"]', '50');

    // Add team hours
    await page.click('[data-testid="add-hunk-button"]');
    
    await page.selectOption('[data-testid="employee-select-0"]', 'captain-test-id');
    await page.fill('[data-testid="hours-input-0"]', '8');

    await page.click('[data-testid="add-hunk-button"]');
    
    await page.selectOption('[data-testid="employee-select-1"]', 'wingman-test-id');
    await page.fill('[data-testid="hours-input-1"]', '8');

    // Step 4: Verify real-time calculations
    await expect(page.locator('[data-testid="section-total-revenue"]')).toContainText('$1,400');
    await expect(page.locator('[data-testid="section-total-tips"]')).toContainText('$140');
    await expect(page.locator('[data-testid="tips-per-hunk"]')).toContainText('$70.00');
    
    // Labor cost percentage should be calculated
    await expect(page.locator('[data-testid="labor-cost-percentage"]')).toBeVisible();

    // Step 5: Test auto-save functionality
    // Wait for auto-save indicator
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saved');

    // Step 6: Submit log
    await page.click('[data-testid="submit-log-button"]');

    // Verify submission success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Log submitted successfully');
    
    // Should redirect to dashboard or log list
    await expect(page).toHaveURL(/\/(dashboard|logs)/);

    // Step 7: Verify log appears in submitted logs
    if (page.url().includes('/dashboard')) {
      await page.click('[data-testid="view-my-logs-button"]');
    }

    await expect(page.locator('[data-testid="log-status-submitted"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-revenue"]')).toContainText('$1,400');
  });

  test('should handle form validation errors gracefully', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Navigate to create log
    await page.click('[data-testid="create-log-button"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-log-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Cannot submit empty log');

    // Add minimal data
    await page.check('[data-testid="section-junk-checkbox"]');
    await page.click('[data-testid="add-junk-job-button"]');

    // Try to submit with incomplete job data
    await page.fill('[data-testid="job-id-input-0"]', 'INCOMPLETE');
    // Leave client name empty
    await page.fill('[data-testid="revenue-input-0"]', '500');

    await page.click('[data-testid="submit-log-button"]');

    // Should show field-specific validation
    await expect(page.locator('[data-testid="client-name-error"]')).toContainText('Client name is required');

    // Fix validation error
    await page.fill('[data-testid="client-name-input-0"]', 'Fixed Client Name');

    // Add required hours
    await page.click('[data-testid="add-hunk-button"]');
    await page.selectOption('[data-testid="employee-select-0"]', 'captain-test-id');
    await page.fill('[data-testid="hours-input-0"]', '6');

    // Should now submit successfully
    await page.click('[data-testid="submit-log-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should work correctly on different mobile screen sizes', async ({ page }) => {
    // Test on iPhone SE (small screen)
    await page.setViewportSize({ width: 320, height: 568 });
    
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="create-log-button"]');

    // Verify form is still usable on small screen
    await expect(page.locator('[data-testid="log-form"]')).toBeVisible();
    
    // Check that buttons are large enough for touch
    const addJobButton = page.locator('[data-testid="add-junk-job-button"]');
    const buttonBox = await addJobButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target

    // Test on larger mobile (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Form should still be responsive
    await expect(page.locator('[data-testid="log-form"]')).toBeVisible();
    
    // Navigation should adapt
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    // Login and start creating log
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="create-log-button"]');

    // Fill out form
    await page.check('[data-testid="section-junk-checkbox"]');
    await page.click('[data-testid="add-junk-job-button"]');
    await page.fill('[data-testid="job-id-input-0"]', 'NETWORK-TEST');
    await page.fill('[data-testid="client-name-input-0"]', 'Network Test Client');
    await page.fill('[data-testid="revenue-input-0"]', '700');

    // Simulate network failure
    await page.route('**/api/**', route => route.abort());

    // Try to submit - should show network error
    await page.click('[data-testid="submit-log-button"]');
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');

    // Restore network
    await page.unroute('**/api/**');

    // Retry should work
    await page.click('[data-testid="retry-button"]');
    
    // Should eventually succeed (may need to add hours first)
    await page.click('[data-testid="add-hunk-button"]');
    await page.selectOption('[data-testid="employee-select-0"]', 'captain-test-id');
    await page.fill('[data-testid="hours-input-0"]', '5');

    await page.click('[data-testid="submit-log-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should maintain form state during auto-save', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="create-log-button"]');

    // Start filling form
    await page.check('[data-testid="section-junk-checkbox"]');
    await page.click('[data-testid="add-junk-job-button"]');
    await page.fill('[data-testid="job-id-input-0"]', 'AUTOSAVE-TEST');
    await page.fill('[data-testid="client-name-input-0"]', 'Auto Save Client');

    // Wait for auto-save
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saving...');
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saved');

    // Continue filling form
    await page.fill('[data-testid="revenue-input-0"]', '900');
    await page.fill('[data-testid="tips-input-0"]', '90');

    // Simulate page refresh (browser back/forward or accidental refresh)
    await page.reload();

    // Form should restore previous state
    await expect(page.locator('[data-testid="job-id-input-0"]')).toHaveValue('AUTOSAVE-TEST');
    await expect(page.locator('[data-testid="client-name-input-0"]')).toHaveValue('Auto Save Client');
    
    // Recently entered data might not be saved yet, but basic structure should be preserved
    await expect(page.locator('[data-testid="section-junk-checkbox"]')).toBeChecked();
  });

  test('should provide appropriate keyboard types for mobile inputs', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="create-log-button"]');
    await page.check('[data-testid="section-junk-checkbox"]');
    await page.click('[data-testid="add-junk-job-button"]');

    // Check input types for mobile optimization
    await expect(page.locator('[data-testid="revenue-input-0"]')).toHaveAttribute('inputmode', 'decimal');
    await expect(page.locator('[data-testid="tips-input-0"]')).toHaveAttribute('inputmode', 'decimal');
    
    await page.click('[data-testid="add-hunk-button"]');
    await expect(page.locator('[data-testid="hours-input-0"]')).toHaveAttribute('inputmode', 'decimal');

    // Text inputs should use default keyboard
    await expect(page.locator('[data-testid="client-name-input-0"]')).toHaveAttribute('type', 'text');
    await expect(page.locator('[data-testid="job-id-input-0"]')).toHaveAttribute('type', 'text');
  });
});

test.describe('Captain Desktop Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/auth/login');
  });

  test('should adapt interface for desktop use', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Desktop should show sidebar navigation
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible();

    // Navigate to create log via sidebar
    await page.click('[data-testid="sidebar-create-log"]');

    // Desktop form should have better layout
    await expect(page.locator('[data-testid="desktop-form-layout"]')).toBeVisible();

    // Should be able to see more information at once
    await page.check('[data-testid="section-junk-checkbox"]');
    await page.check('[data-testid="section-move-checkbox"]');

    // Both sections should be visible simultaneously on desktop
    await expect(page.locator('[data-testid="junk-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="move-section"]')).toBeVisible();

    // Real-time calculations should be more prominent
    await expect(page.locator('[data-testid="calculations-sidebar"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'captain@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="sidebar-create-log"]');

    // Test tab navigation through form
    await page.keyboard.press('Tab'); // Should focus first form element
    await page.keyboard.press('Space'); // Should check junk section
    
    await expect(page.locator('[data-testid="section-junk-checkbox"]')).toBeChecked();

    // Continue tabbing through form elements
    await page.keyboard.press('Tab'); // Move to next element
    await page.keyboard.press('Tab'); // Continue...
    
    // Should be able to navigate entire form with keyboard
    await page.keyboard.press('Enter'); // Should activate focused button
  });
});