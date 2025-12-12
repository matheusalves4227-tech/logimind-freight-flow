import { test, expect } from '@playwright/test';
import { validUser, invalidUsers } from './fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should switch between login and signup tabs', async ({ page }) => {
    // Switch to signup
    await page.getByRole('tab', { name: /cadastrar/i }).click();
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible();
    await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    
    // Switch back to login
    await page.getByRole('tab', { name: /entrar/i }).click();
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
  });

  test.describe('Login Validation - Invalid Inputs', () => {
    test('should show error for empty email', async ({ page }) => {
      await page.getByLabel(/senha/i).fill(invalidUsers.emptyEmail.password);
      await page.getByRole('button', { name: /entrar/i }).click();
      
      // HTML5 validation or custom error
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByLabel(/email/i).fill(invalidUsers.invalidEmail.email);
      await page.getByLabel(/senha/i).fill(invalidUsers.invalidEmail.password);
      await page.getByRole('button', { name: /entrar/i }).click();
      
      // Check for validation
      const emailInput = page.getByLabel(/email/i);
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });

    test('should show error for empty password', async ({ page }) => {
      await page.getByLabel(/email/i).fill(validUser.email);
      await page.getByRole('button', { name: /entrar/i }).click();
      
      const passwordInput = page.getByLabel(/senha/i);
      await expect(passwordInput).toHaveAttribute('required', '');
    });
  });

  test.describe('Signup Validation - Invalid Inputs', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /cadastrar/i }).click();
    });

    test('should reject weak password (too short)', async ({ page }) => {
      await page.getByLabel(/nome completo/i).fill(validUser.name);
      await page.getByLabel(/email/i).fill(invalidUsers.shortPassword.email);
      await page.getByLabel(/senha/i).fill(invalidUsers.shortPassword.password);
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      // Should show password strength error
      await expect(page.getByText(/8 caracteres/i)).toBeVisible();
    });

    test('should reject password without uppercase', async ({ page }) => {
      await page.getByLabel(/nome completo/i).fill(validUser.name);
      await page.getByLabel(/email/i).fill(invalidUsers.noUppercase.email);
      await page.getByLabel(/senha/i).fill(invalidUsers.noUppercase.password);
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      await expect(page.getByText(/maiúscula/i)).toBeVisible();
    });

    test('should reject password without lowercase', async ({ page }) => {
      await page.getByLabel(/nome completo/i).fill(validUser.name);
      await page.getByLabel(/email/i).fill(invalidUsers.noLowercase.email);
      await page.getByLabel(/senha/i).fill(invalidUsers.noLowercase.password);
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      await expect(page.getByText(/minúscula/i)).toBeVisible();
    });

    test('should reject password without numbers', async ({ page }) => {
      await page.getByLabel(/nome completo/i).fill(validUser.name);
      await page.getByLabel(/email/i).fill(invalidUsers.noNumber.email);
      await page.getByLabel(/senha/i).fill(invalidUsers.noNumber.password);
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      await expect(page.getByText(/número/i)).toBeVisible();
    });
  });

  test('should have link to reset password', async ({ page }) => {
    await expect(page.getByText(/esqueceu/i)).toBeVisible();
    await page.getByText(/esqueceu/i).click();
    await expect(page).toHaveURL('/reset-password');
  });
});

test.describe('Reset Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reset-password');
  });

  test('should display reset password form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /redefinir senha/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('emailinvalido');
    await page.getByRole('button', { name: /enviar/i }).click();
    
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });
});
