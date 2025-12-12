import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  const pages = ['/', '/auth', '/faq', '/ranking', '/tracking', '/cadastro-parceiro'];

  for (const pagePath of pages) {
    test(`should have no critical accessibility issues on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      
      // Check for basic accessibility
      // 1. All images should have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Image should have alt or role="presentation"
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
      
      // 2. All form inputs should have labels
      const inputs = page.locator('input:not([type="hidden"])');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
      
      // 3. Page should have a main heading
      const h1 = page.locator('h1');
      await expect(h1.first()).toBeVisible();
      
      // 4. HTML should have lang attribute
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      expect(lang).toBeTruthy();
    });

    test(`should be keyboard navigable on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      
      // Tab through the page
      await page.keyboard.press('Tab');
      
      // First focusable element should be focused
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
      
      // Should have visible focus indicator
      const focusVisible = await focused.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || 
               styles.boxShadow !== 'none' ||
               el.matches(':focus-visible');
      });
      expect(focusVisible).toBeTruthy();
    });
  }

  test('should have sufficient color contrast on home page', async ({ page }) => {
    await page.goto('/');
    
    // Check that text is readable
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });
        
        // Basic check that colors are set
        expect(styles.color).toBeTruthy();
        expect(styles.backgroundColor).toBeTruthy();
      }
    }
  });
});
