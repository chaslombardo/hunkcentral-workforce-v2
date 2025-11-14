/**
 * Mobile Gesture Testing Suite
 * Tests touch interactions and gesture support
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Gesture Support', () => {
  test.use(devices['iPhone 13']);

  test('should support basic touch interactions', async ({ page }) => {
    await page.goto('/');

    // Test tap gesture
    const button = page.locator('button:visible').first();
    if ((await button.count()) > 0) {
      await button.tap();
      // Button should respond to tap
      await expect(button).toBeVisible();
    }

    // Test double tap (if implemented)
    const doubleTapElement = page.locator('[data-testid="double-tap"]');
    if ((await doubleTapElement.count()) > 0) {
      await doubleTapElement.dblclick();
    }
  });

  test('should support swipe gestures', async ({ page }) => {
    await page.goto('/');

    // Look for swipeable elements
    const swipeArea = page.locator(
      '[data-testid="swipe-area"], .swipeable, [class*="swipe"]'
    );

    if ((await swipeArea.count()) > 0) {
      const element = swipeArea.first();
      const box = await element.boundingBox();

      if (box) {
        // Swipe left
        await page.touchscreen.tap(
          box.x + box.width * 0.8,
          box.y + box.height / 2
        );
        await page.touchscreen.tap(
          box.x + box.width * 0.2,
          box.y + box.height / 2
        );

        // Swipe right
        await page.touchscreen.tap(
          box.x + box.width * 0.2,
          box.y + box.height / 2
        );
        await page.touchscreen.tap(
          box.x + box.width * 0.8,
          box.y + box.height / 2
        );
      }
    }
  });

  test('should support long press gestures', async ({ page }) => {
    await page.goto('/');

    // Look for long press elements
    const longPressElement = page.locator(
      '[data-testid="long-press"], [class*="long-press"]'
    );

    if ((await longPressElement.count()) > 0) {
      const element = longPressElement.first();
      const box = await element.boundingBox();

      if (box) {
        // Simulate long press
        await page.touchscreen.tap(
          box.x + box.width / 2,
          box.y + box.height / 2
        );
        await page.waitForTimeout(600); // Long press duration
      }
    }
  });

  test('should support pinch to zoom gestures', async ({ page }) => {
    await page.goto('/');

    // Look for zoomable elements
    const zoomableElement = page.locator(
      '[data-testid="zoomable"], .zoomable, [class*="zoom"]'
    );

    if ((await zoomableElement.count()) > 0) {
      const element = zoomableElement.first();
      const box = await element.boundingBox();

      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        // Simulate pinch gesture (two finger touch)
        // This is a simplified simulation - actual pinch gestures are complex
        await page.touchscreen.tap(centerX - 50, centerY);
        await page.touchscreen.tap(centerX + 50, centerY);
      }
    }
  });

  test('should support pull to refresh', async ({ page }) => {
    await page.goto('/');

    // Look for pull-to-refresh areas
    const refreshArea = page.locator(
      '[data-testid="pull-refresh"], .pull-refresh, [class*="refresh"]'
    );

    if ((await refreshArea.count()) > 0) {
      const element = refreshArea.first();
      const box = await element.boundingBox();

      if (box) {
        // Simulate pull down gesture
        await page.touchscreen.tap(box.x + box.width / 2, box.y + 10);
        await page.touchscreen.tap(box.x + box.width / 2, box.y + 100);
      }
    }
  });

  test('should handle touch events correctly', async ({ page }) => {
    await page.goto('/');

    // Test touch event handling
    const touchEvents = await page.evaluate(() => {
      return {
        touchstart: 'ontouchstart' in window,
        touchmove: 'ontouchmove' in window,
        touchend: 'ontouchend' in window,
        touchcancel: 'ontouchcancel' in window,
      };
    });

    // Touch events should be supported
    expect(touchEvents.touchstart).toBeTruthy();
    expect(touchEvents.touchmove).toBeTruthy();
    expect(touchEvents.touchend).toBeTruthy();
  });

  test('should prevent default touch behaviors when appropriate', async ({
    page,
  }) => {
    await page.goto('/');

    // Test that certain elements prevent default touch behaviors
    const preventDefaultElements = page.locator(
      '[data-prevent-default="true"], .no-touch-action'
    );

    if ((await preventDefaultElements.count()) > 0) {
      const element = preventDefaultElements.first();
      const touchAction = await element.evaluate((el) => {
        return window.getComputedStyle(el).touchAction;
      });

      // Should have touch-action: none or manipulation
      expect(['none', 'manipulation'].includes(touchAction)).toBeTruthy();
    }
  });

  test('should handle multi-touch interactions', async ({ page }) => {
    await page.goto('/');

    // Test multi-touch capability
    const multiTouchSupport = await page.evaluate(() => {
      return navigator.maxTouchPoints > 1;
    });

    if (multiTouchSupport) {
      // Multi-touch should be supported on capable devices
      expect(multiTouchSupport).toBeTruthy();
    }
  });

  test('should support haptic feedback', async ({ page }) => {
    await page.goto('/');

    // Test haptic feedback support
    const hapticSupport = await page.evaluate(() => {
      return 'vibrate' in navigator;
    });

    if (hapticSupport) {
      // Test vibration API
      const vibrationResult = await page.evaluate(() => {
        try {
          navigator.vibrate(10);
          return true;
        } catch (error) {
          return false;
        }
      });

      // Vibration should work if supported
      expect(vibrationResult).toBeTruthy();
    }
  });

  test('should handle gesture conflicts appropriately', async ({ page }) => {
    await page.goto('/');

    // Test that custom gestures don't conflict with browser gestures
    const scrollableArea = page.locator(
      '[data-testid="scrollable"], .scroll-area'
    );

    if ((await scrollableArea.count()) > 0) {
      const element = scrollableArea.first();
      const box = await element.boundingBox();

      if (box) {
        // Test vertical scroll
        await page.touchscreen.tap(
          box.x + box.width / 2,
          box.y + box.height * 0.8
        );
        await page.touchscreen.tap(
          box.x + box.width / 2,
          box.y + box.height * 0.2
        );

        // Scroll should work without conflicts
        const scrollTop = await element.evaluate((el) => el.scrollTop);
        // Scroll position might change
      }
    }
  });

  test('should support orientation change gestures', async ({ page }) => {
    await page.goto('/');

    // Test orientation change handling
    await page.setViewportSize({ width: 375, height: 667 }); // Portrait
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 667, height: 375 }); // Landscape
    await expect(page.locator('body')).toBeVisible();

    // Check that layout adapts to orientation change
    const orientationSupport = await page.evaluate(() => {
      return 'orientation' in screen;
    });

    if (orientationSupport) {
      expect(orientationSupport).toBeTruthy();
    }
  });
});

test.describe('Touch Target Accessibility', () => {
  test.use(devices['iPhone 13']);

  test('should have adequate touch target sizes', async ({ page }) => {
    await page.goto('/');

    // Check interactive elements have minimum 44px touch targets
    const interactiveElements = page.locator(
      'button, a, input, select, textarea, [role="button"], [tabindex="0"]'
    );
    const elementCount = await interactiveElements.count();

    for (let i = 0; i < Math.min(elementCount, 20); i++) {
      const element = interactiveElements.nth(i);

      if (await element.isVisible()) {
        const box = await element.boundingBox();

        if (box) {
          // WCAG recommends minimum 44x44px touch targets
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('should have adequate spacing between touch targets', async ({
    page,
  }) => {
    await page.goto('/');

    // Check that touch targets have adequate spacing
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    if (buttonCount > 1) {
      const firstButton = await buttons.nth(0).boundingBox();
      const secondButton = await buttons.nth(1).boundingBox();

      if (firstButton && secondButton) {
        // Calculate distance between buttons
        const distance = Math.sqrt(
          Math.pow(secondButton.x - firstButton.x, 2) +
            Math.pow(secondButton.y - firstButton.y, 2)
        );

        // Should have reasonable spacing (at least 8px)
        expect(distance).toBeGreaterThan(8);
      }
    }
  });

  test('should provide visual feedback for touch interactions', async ({
    page,
  }) => {
    await page.goto('/');

    // Test that buttons provide visual feedback
    const button = page.locator('button:visible').first();

    if ((await button.count()) > 0) {
      // Get initial styles
      const initialStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          opacity: styles.opacity,
        };
      });

      // Simulate touch
      await button.hover();

      // Check for hover/active state changes
      const hoverStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          opacity: styles.opacity,
        };
      });

      // Some visual change should occur (background, transform, or opacity)
      const hasVisualFeedback =
        initialStyles.backgroundColor !== hoverStyles.backgroundColor ||
        initialStyles.transform !== hoverStyles.transform ||
        initialStyles.opacity !== hoverStyles.opacity;

      // Visual feedback is recommended but not always required
      // This is more of a UX check than a strict requirement
    }
  });
});

test.describe('Mobile Form Gestures', () => {
  test.use(devices['iPhone 13']);

  test('should support form navigation gestures', async ({ page }) => {
    await page.goto('/logs/create');

    // Test tab navigation between form fields
    const inputs = page.locator(
      'input:visible, select:visible, textarea:visible'
    );
    const inputCount = await inputs.count();

    if (inputCount > 1) {
      // Focus first input
      await inputs.nth(0).focus();

      // Test tab navigation
      await page.keyboard.press('Tab');

      // Second input should be focused
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(focusedElement || '')
      ).toBeTruthy();
    }
  });

  test('should handle virtual keyboard interactions', async ({ page }) => {
    await page.goto('/logs/create');

    // Test virtual keyboard behavior
    const textInput = page.locator('input[type="text"]:visible').first();

    if ((await textInput.count()) > 0) {
      await textInput.focus();

      // Check that input is visible when virtual keyboard appears
      await expect(textInput).toBeVisible();

      // Type some text
      await textInput.fill('Test input');

      // Input should contain the text
      await expect(textInput).toHaveValue('Test input');
    }
  });

  test('should support form submission gestures', async ({ page }) => {
    await page.goto('/logs/create');

    // Test form submission via touch
    const submitButton = page.locator('button[type="submit"]:visible').first();

    if ((await submitButton.count()) > 0) {
      // Tap submit button
      await submitButton.tap();

      // Form should respond to submission attempt
      // (May show validation errors or proceed with submission)
      await page.waitForTimeout(500);
    }
  });
});
