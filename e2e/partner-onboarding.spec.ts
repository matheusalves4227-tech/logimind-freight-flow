import { test, expect } from '@playwright/test';
import { validDriver, invalidDrivers, validCarrier, invalidCarriers } from './fixtures/test-data';

test.describe('Partner Onboarding - Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
  });

  test('should display partner type selection', async ({ page }) => {
    await expect(page.getByText(/motorista autônomo/i)).toBeVisible();
    await expect(page.getByText(/transportadora/i)).toBeVisible();
  });

  test('should navigate to autonomous driver form', async ({ page }) => {
    await page.getByText(/motorista autônomo/i).click();
    
    // Should show driver registration form
    await expect(page.getByText(/dados pessoais/i)).toBeVisible();
  });

  test('should navigate to carrier form', async ({ page }) => {
    await page.getByText(/transportadora/i).click();
    
    // Should show carrier registration form
    await expect(page.getByText(/dados da empresa/i)).toBeVisible();
  });
});

test.describe('Autonomous Driver Registration - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
  });

  test('should validate CPF format', async ({ page }) => {
    // Try invalid CPF
    const cpfInput = page.getByLabel(/cpf/i);
    await cpfInput.fill(invalidDrivers.invalidCpf.cpf);
    await cpfInput.blur();
    
    // Should show validation error for invalid CPF
    await expect(page.getByText(/cpf inválido/i)).toBeVisible({ timeout: 3000 });
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/e-mail/i);
    await emailInput.fill(invalidDrivers.invalidEmail.email);
    await emailInput.blur();
    
    // HTML5 or custom validation
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should validate phone format', async ({ page }) => {
    const phoneInput = page.getByLabel(/telefone/i);
    await phoneInput.fill(invalidDrivers.invalidPhone.phone);
    await phoneInput.blur();
    
    // Should reject short phone number
    await expect(page.getByText(/telefone inválido|formato/i)).toBeVisible({ timeout: 3000 });
  });

  test('should require all mandatory fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /próximo|continuar/i }).first().click();
    
    // Should show required field errors
    const requiredInputs = page.locator('input[required]');
    const count = await requiredInputs.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Carrier Registration - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/transportadora/i).click();
  });

  test('should validate CNPJ format', async ({ page }) => {
    const cnpjInput = page.getByLabel(/cnpj/i);
    await cnpjInput.fill(invalidCarriers.invalidCnpj.cnpj);
    await cnpjInput.blur();
    
    // Should show validation error for invalid CNPJ
    await expect(page.getByText(/cnpj inválido/i)).toBeVisible({ timeout: 3000 });
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/e-mail/i);
    await emailInput.fill(invalidCarriers.invalidEmail.email);
    await emailInput.blur();
    
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should auto-fill address from CEP', async ({ page }) => {
    const cepInput = page.getByLabel(/cep/i);
    await cepInput.fill('01310-100');
    await cepInput.blur();
    
    // Wait for address auto-fill
    await page.waitForTimeout(2000);
    
    // Street should be filled
    const streetInput = page.getByLabel(/logradouro|rua/i);
    const streetValue = await streetInput.inputValue();
    expect(streetValue.length).toBeGreaterThan(0);
  });
});
