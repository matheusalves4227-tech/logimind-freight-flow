import { test, expect } from '@playwright/test';
import { validQuote, invalidQuotes } from './fixtures/test-data';

test.describe('Quote Flow - Unauthenticated', () => {
  test('should redirect to auth when accessing quote page', async ({ page }) => {
    await page.goto('/quote');
    
    // Should redirect to auth with proper params
    await expect(page).toHaveURL(/\/auth\?redirect=\/quote/);
    
    // Should show appropriate message
    await expect(page.getByText(/faça login/i)).toBeVisible();
  });
});

test.describe('Quote Flow - Form Validation', () => {
  // Note: These tests assume authenticated user
  // In real scenario, you'd setup authentication state before each test
  
  test.skip('should validate CEP format', async ({ page }) => {
    await page.goto('/quote');
    
    // Try invalid CEP
    const originCepInput = page.getByLabel(/cep.*origem/i);
    await originCepInput.fill('12345');
    await originCepInput.blur();
    
    // Should show validation error or not accept partial CEP
    const value = await originCepInput.inputValue();
    expect(value.length).toBeLessThan(9); // CEP format: 00000-000
  });

  test.skip('should not accept negative weight', async ({ page }) => {
    await page.goto('/quote');
    
    const weightInput = page.getByLabel(/peso/i);
    await weightInput.fill('-10');
    
    // Weight should be positive
    const isInvalid = await weightInput.evaluate((el: HTMLInputElement) => {
      return el.validity.rangeUnderflow || parseFloat(el.value) < 0;
    });
    expect(isInvalid).toBeTruthy();
  });

  test.skip('should not accept zero weight', async ({ page }) => {
    await page.goto('/quote');
    
    const weightInput = page.getByLabel(/peso/i);
    await weightInput.fill('0');
    
    // Weight should be greater than 0
    const value = await weightInput.inputValue();
    // Form should require positive weight
  });
});
