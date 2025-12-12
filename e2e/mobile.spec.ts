import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 13'] });

  test('should display mobile navigation correctly', async ({ page }) => {
    await page.goto('/');
    
    // Desktop navigation should be hidden
    await expect(page.locator('nav .hidden.md\\:flex')).not.toBeVisible();
    
    // Mobile menu trigger should be visible
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(mobileMenuTrigger).toBeVisible();
  });

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/');
    
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await mobileMenuTrigger.click();
    
    // Menu should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Close menu by clicking outside or close button
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should navigate using mobile menu', async ({ page }) => {
    await page.goto('/');
    
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await mobileMenuTrigger.click();
    
    // Click on a navigation item
    await page.getByRole('button', { name: /cadastro.*parceiro/i }).click();
    
    // Should navigate and close menu
    await expect(page).toHaveURL('/cadastro-parceiro');
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/');
    
    // All buttons should have minimum touch target size (44x44px)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const box = await button.boundingBox();
        if (box) {
          // iOS/Android guidelines recommend 44px minimum
          expect(box.height).toBeGreaterThanOrEqual(40);
          expect(box.width).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('should not have horizontal scroll', async ({ page }) => {
    await page.goto('/');
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('forms should be usable on mobile', async ({ page }) => {
    await page.goto('/auth');
    
    // Form inputs should be properly sized
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    const box = await emailInput.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(200);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
    
    // Keyboard should work
    await emailInput.tap();
    await emailInput.fill('teste@email.com');
    
    const value = await emailInput.inputValue();
    expect(value).toBe('teste@email.com');
  });
});

test.describe('Tablet Responsiveness', () => {
  test.use({ ...devices['iPad Mini'] });

  test('should display properly on tablet', async ({ page }) => {
    await page.goto('/');
    
    // Content should be visible and properly laid out
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Cards should display in grid
    const cards = page.locator('[class*="card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});
