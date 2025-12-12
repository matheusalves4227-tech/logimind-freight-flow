import { test, expect } from '@playwright/test';

test.describe('Tracking Page - Public Access', () => {
  test('should allow access to tracking page', async ({ page }) => {
    await page.goto('/tracking');
    
    // Should show tracking search form
    await expect(page.getByText(/rastreamento/i)).toBeVisible();
    await expect(page.getByLabel(/código/i)).toBeVisible();
  });

  test('should validate tracking code format', async ({ page }) => {
    await page.goto('/tracking');
    
    const trackingInput = page.getByLabel(/código/i);
    await trackingInput.fill('INVALID');
    await page.getByRole('button', { name: /rastrear/i }).click();
    
    // Should show error for invalid code
    await expect(page.getByText(/não encontrado|inválido/i)).toBeVisible({ timeout: 5000 });
  });

  test('should search with valid tracking code format', async ({ page }) => {
    await page.goto('/tracking');
    
    const trackingInput = page.getByLabel(/código/i);
    await trackingInput.fill('LM-2024-01-0001');
    await page.getByRole('button', { name: /rastrear/i }).click();
    
    // Should attempt to search (may show not found for fake code)
    await page.waitForTimeout(1000);
    // Response depends on actual data
  });

  test('should handle empty tracking code', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.getByRole('button', { name: /rastrear/i }).click();
    
    // Should show validation or not submit
    const trackingInput = page.getByLabel(/código/i);
    await expect(trackingInput).toHaveAttribute('required', '');
  });
});
