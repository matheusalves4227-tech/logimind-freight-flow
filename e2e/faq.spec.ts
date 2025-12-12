import { test, expect } from '@playwright/test';

test.describe('FAQ Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
  });

  test('should display FAQ page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /perguntas frequentes/i })).toBeVisible();
  });

  test('should have expandable accordion items', async ({ page }) => {
    // Find first accordion item
    const firstQuestion = page.locator('[data-state="closed"]').first();
    
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click();
      
      // Should expand and show answer
      await expect(firstQuestion).toHaveAttribute('data-state', 'open');
    }
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toContain('faq');
    
    // Check for FAQ structured data
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
    if (structuredData) {
      const parsed = JSON.parse(structuredData);
      expect(parsed['@type']).toContain('FAQPage');
    }
  });
});
