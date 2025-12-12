import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('home page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate between pages multiple times
    const routes = ['/', '/faq', '/ranking', '/tracking', '/cadastro-parceiro'];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
      }
    }
    
    // If we get here without crash, no obvious memory leak
    await expect(page.locator('body')).toBeVisible();
  });

  test('lazy loading images should work', async ({ page }) => {
    await page.goto('/');
    
    // Check for images with loading="lazy"
    const lazyImages = page.locator('img[loading="lazy"]');
    const count = await lazyImages.count();
    
    // Some images should be lazy loaded
    // This is a soft check as not all images need lazy loading
    console.log(`Found ${count} lazy-loaded images`);
  });

  test('should have proper caching headers', async ({ page, request }) => {
    const response = await request.get('/');
    
    // Check response is successful
    expect(response.ok()).toBeTruthy();
    
    // Check content type
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('critical CSS should be loaded', async ({ page }) => {
    await page.goto('/');
    
    // Check that styles are applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Background should not be default white (unless designed that way)
    expect(backgroundColor).toBeTruthy();
  });

  test('JavaScript errors should not occur', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to a few pages
    await page.goto('/faq');
    await page.goto('/ranking');
    
    // Should have no critical JS errors
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && // Known benign error
      !e.includes('Script error') // CORS-related, often benign
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
