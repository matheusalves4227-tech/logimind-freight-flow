import { test, expect } from '@playwright/test';

test.describe('Ranking Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ranking');
  });

  test('should display ranking page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ranking/i })).toBeVisible();
  });

  test('should show ranking tabs for drivers and carriers', async ({ page }) => {
    // Should have tabs to switch between rankings
    await expect(page.getByRole('tab', { name: /motorista/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /transportadora/i })).toBeVisible();
  });

  test('should switch between ranking types', async ({ page }) => {
    // Click on carriers tab
    await page.getByRole('tab', { name: /transportadora/i }).click();
    
    // Content should change
    await expect(page.getByText(/transportadora/i)).toBeVisible();
  });

  test('should display ranking metrics', async ({ page }) => {
    // Rankings should show performance indicators
    await expect(page.getByText(/avaliação|pontuação|estrela/i)).toBeVisible();
  });
});
