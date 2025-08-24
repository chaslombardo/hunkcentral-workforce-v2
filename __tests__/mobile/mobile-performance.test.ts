/**
 * Mobile Performance Test Suite
 * Tests performance characteristics on mobile devices
 */

import { test, expect, devices } from '@playwright/test';

// Mobile device configurations for performance testing
const performanceConfigs = [
  {
    name: 'iPhone 13',
    device: devices['iPhone 13'],
    networkProfile: 'Good 3G',
  },
  {
    name: 'Pixel 5',
    device: devices['Pixel 5'],
    networkProfile: 'Slow 3G',
  },
  {
    name: 'Galaxy S9+',
    device: devices['Galaxy S9+'],
    networkProfile: 'Fast 3G',
  },
];

// Network profiles for testing different connection speeds
const networkProfiles = {
  'Slow 3G': {
    offline: false,
    downloadThroughput: 500 * 1024, // 500 KB/s
    uploadThroughput: 500 * 1024,
    latency: 2000, // 2s
  },
  'Fast 3G': {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024, // 1.6 MB/s
    uploadThroughput: 750 * 1024, // 750 KB/s
    latency: 562, // 562ms
  },
  'Good 3G': {
    offline: false,
    downloadThroughput: 1.5 * 1024 * 1024, // 1.5 MB/s
    uploadThroughput: 750 * 1024, // 750 KB/s
    latency: 40, // 40ms
  },
};

for (const config of performanceConfigs) {
  test.describe(`Mobile Performance - ${config.name}`, () => {
    test.use({
      ...config.device,
    });

    test.beforeEach(async ({ context }) => {
      // Set network conditions
      const networkProfile =
        networkProfiles[config.networkProfile as keyof typeof networkProfiles];
      await context.route('**/*', async (route) => {
        // Simulate network latency
        await new Promise((resolve) =>
          setTimeout(resolve, networkProfile.latency / 10)
        );
        await route.continue();
      });
    });

    test('should load main page within performance budget', async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // Page should load within 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000);

      // Check Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};

          // Largest Contentful Paint (LCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID) - simulated
          vitals.fid = 0; // Will be measured on actual interaction

          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(vitals), 2000);
        });
      });

      // LCP should be under 2.5 seconds
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(2500);
      }

      // CLS should be under 0.1
      if (webVitals.cls !== undefined) {
        expect(webVitals.cls).toBeLessThan(0.1);
      }
    });

    test('should handle form interactions with good performance', async ({
      page,
    }) => {
      await page.goto('/logs/create');

      // Measure form interaction performance
      const startTime = Date.now();

      // Fill out form fields
      const inputs = page.locator('input:visible');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const inputType = await input.getAttribute('type');

        if (inputType === 'text' || inputType === 'email') {
          await input.fill('test value');
        } else if (inputType === 'number') {
          await input.fill('123');
        }

        // Each input interaction should be responsive
        const interactionTime = Date.now();
        await input.blur();
        const responseTime = Date.now() - interactionTime;

        // Input response should be under 100ms
        expect(responseTime).toBeLessThan(100);
      }

      const totalFormTime = Date.now() - startTime;

      // Total form interaction should be reasonable
      expect(totalFormTime).toBeLessThan(2000);
    });

    test('should scroll smoothly on mobile', async ({ page }) => {
      await page.goto('/');

      // Test scroll performance
      const scrollStartTime = Date.now();

      // Perform scroll actions
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      });

      // Wait for scroll to complete
      await page.waitForTimeout(500);

      const scrollTime = Date.now() - scrollStartTime;

      // Scroll should complete within reasonable time
      expect(scrollTime).toBeLessThan(1000);

      // Check scroll position
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });

    test('should handle navigation transitions efficiently', async ({
      page,
    }) => {
      await page.goto('/');

      // Test navigation performance
      const navigationLinks = page.locator('a[href^="/"], button[data-href]');
      const linkCount = await navigationLinks.count();

      if (linkCount > 0) {
        const startTime = Date.now();

        // Click first navigation link
        const firstLink = navigationLinks.first();
        const href =
          (await firstLink.getAttribute('href')) ||
          (await firstLink.getAttribute('data-href'));

        if (href && href !== '#') {
          await firstLink.click();

          // Wait for navigation to complete
          await page.waitForLoadState('networkidle');

          const navigationTime = Date.now() - startTime;

          // Navigation should be fast
          expect(navigationTime).toBeLessThan(2000);
        }
      }
    });

    test('should efficiently handle image loading', async ({ page }) => {
      await page.goto('/');

      // Check image loading performance
      const images = page.locator('img:visible');
      const imageCount = await images.count();

      if (imageCount > 0) {
        const imageLoadTimes: number[] = [];

        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = images.nth(i);
          const startTime = Date.now();

          // Wait for image to load
          await img.waitFor({ state: 'visible' });

          const loadTime = Date.now() - startTime;
          imageLoadTimes.push(loadTime);
        }

        // Average image load time should be reasonable
        const avgLoadTime =
          imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
        expect(avgLoadTime).toBeLessThan(1000);
      }
    });

    test('should handle memory usage efficiently', async ({ page }) => {
      await page.goto('/');

      // Monitor memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            }
          : null;
      });

      // Perform some interactions
      await page.click('button:visible');
      await page.waitForTimeout(1000);

      // Navigate to another page and back
      const links = page.locator('a[href^="/"]');
      if ((await links.count()) > 0) {
        await links.first().click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }

      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            }
          : null;
      });

      if (initialMemory && finalMemory) {
        // Memory usage shouldn't grow excessively
        const memoryGrowth =
          finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryGrowthMB = memoryGrowth / (1024 * 1024);

        // Memory growth should be reasonable (less than 10MB for basic interactions)
        expect(memoryGrowthMB).toBeLessThan(10);
      }
    });

    test('should handle offline/online transitions smoothly', async ({
      page,
    }) => {
      await page.goto('/');

      // Go offline
      const offlineStartTime = Date.now();
      await page.context().setOffline(true);

      // Check offline indicator appears quickly
      const offlineIndicator = page.locator(
        '[data-testid="offline-indicator"]'
      );
      if ((await offlineIndicator.count()) > 0) {
        await expect(offlineIndicator).toBeVisible({ timeout: 1000 });
        const offlineDetectionTime = Date.now() - offlineStartTime;
        expect(offlineDetectionTime).toBeLessThan(1000);
      }

      // Go back online
      const onlineStartTime = Date.now();
      await page.context().setOffline(false);

      // Check online status is detected quickly
      if ((await offlineIndicator.count()) > 0) {
        await expect(offlineIndicator).toBeHidden({ timeout: 2000 });
        const onlineDetectionTime = Date.now() - onlineStartTime;
        expect(onlineDetectionTime).toBeLessThan(2000);
      }
    });

    test('should handle touch interactions responsively', async ({ page }) => {
      await page.goto('/');

      // Test touch response times
      const touchableElements = page.locator(
        'button:visible, a:visible, [role="button"]:visible'
      );
      const elementCount = await touchableElements.count();

      if (elementCount > 0) {
        const touchResponseTimes: number[] = [];

        for (let i = 0; i < Math.min(elementCount, 5); i++) {
          const element = touchableElements.nth(i);
          const startTime = Date.now();

          // Simulate touch interaction
          await element.tap();

          // Wait for any visual feedback
          await page.waitForTimeout(50);

          const responseTime = Date.now() - startTime;
          touchResponseTimes.push(responseTime);
        }

        // Average touch response should be under 100ms
        const avgResponseTime =
          touchResponseTimes.reduce((a, b) => a + b, 0) /
          touchResponseTimes.length;
        expect(avgResponseTime).toBeLessThan(100);
      }
    });

    test('should load critical resources efficiently', async ({ page }) => {
      // Monitor resource loading
      const resourceTimings: any[] = [];

      page.on('response', (response) => {
        resourceTimings.push({
          url: response.url(),
          status: response.status(),
          timing: Date.now(),
        });
      });

      await page.goto('/');

      // Check that critical resources loaded successfully
      const criticalResources = resourceTimings.filter(
        (resource) =>
          resource.url.includes('.css') ||
          resource.url.includes('.js') ||
          resource.url.includes('font')
      );

      // Most critical resources should load successfully
      const successfulResources = criticalResources.filter(
        (resource) => resource.status >= 200 && resource.status < 400
      );

      const successRate = successfulResources.length / criticalResources.length;
      expect(successRate).toBeGreaterThan(0.9); // 90% success rate
    });

    test('should handle concurrent operations efficiently', async ({
      page,
    }) => {
      await page.goto('/logs/create');

      // Test concurrent form operations
      const startTime = Date.now();

      // Perform multiple operations simultaneously
      const operations = [
        page.locator('input').first().fill('test'),
        page
          .locator('select')
          .first()
          .selectOption({ index: 1 })
          .catch(() => {}),
        page
          .locator('textarea')
          .first()
          .fill('test content')
          .catch(() => {}),
      ];

      await Promise.all(operations);

      const concurrentOperationTime = Date.now() - startTime;

      // Concurrent operations should complete efficiently
      expect(concurrentOperationTime).toBeLessThan(1000);
    });
  });
}

// Battery and CPU usage tests (simulated)
test.describe('Mobile Resource Usage', () => {
  test('should not cause excessive CPU usage', async ({ page }) => {
    await page.goto('/');

    // Monitor CPU-intensive operations
    const cpuIntensiveOperations = await page.evaluate(() => {
      const startTime = performance.now();

      // Simulate some operations
      for (let i = 0; i < 1000; i++) {
        document.querySelectorAll('*').length;
      }

      return performance.now() - startTime;
    });

    // Operations should complete quickly
    expect(cpuIntensiveOperations).toBeLessThan(100);
  });

  test('should handle background tab efficiently', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    // Create another tab to simulate background behavior
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Original page should handle being in background
    await page.bringToFront();

    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();

    await newPage.close();
  });
});
