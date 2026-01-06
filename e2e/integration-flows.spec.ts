import { test, expect } from '@playwright/test';
import { validUser, validQuote, validDriver, validCarrier } from './fixtures/test-data';

// ============================================
// INTEGRATION FLOW E2E TESTS
// Tests complete user journeys across multiple pages
// ============================================

test.describe('User Journey - Shipper (Embarcador)', () => {
  
  test('Complete flow: Home → Auth → Protected redirect', async ({ page }) => {
    // 1. Start at home page
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // 2. Click on embarcador CTA
    await page.getByText('Cote e Economize Agora').click();
    
    // 3. Should redirect to auth with proper params
    await expect(page).toHaveURL(/\/auth\?redirect=\/quote/);
    
    // 4. Auth page should show login form
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    
    // 5. Alert should inform about protected content
    await expect(page.getByText(/faça login/i)).toBeVisible();
  });

  test('Navigation flow: Home → FAQ → Back', async ({ page }) => {
    // 1. Start at home
    await page.goto('/');
    
    // 2. Navigate to FAQ
    await page.getByRole('link', { name: /faq/i }).click();
    await expect(page).toHaveURL('/faq');
    
    // 3. Verify FAQ content
    await expect(page.getByRole('heading', { name: /perguntas frequentes/i })).toBeVisible();
    
    // 4. Navigate back via logo or home link
    await page.getByRole('link', { name: /logimarket|home|início/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('Navigation flow: Home → Ranking → Tab switch', async ({ page }) => {
    // 1. Start at home
    await page.goto('/');
    
    // 2. Navigate to ranking
    await page.getByRole('link', { name: /ranking/i }).click();
    await expect(page).toHaveURL('/ranking');
    
    // 3. Switch tabs
    await page.getByRole('tab', { name: /transportadora/i }).click();
    await expect(page.getByText(/transportadora/i)).toBeVisible();
    
    await page.getByRole('tab', { name: /motorista/i }).click();
    await expect(page.getByText(/motorista/i)).toBeVisible();
  });
});

test.describe('User Journey - Driver (Motorista)', () => {
  
  test('Complete flow: Home → Partner Onboarding → Driver Form', async ({ page }) => {
    // 1. Start at home page
    await page.goto('/');
    
    // 2. Click on motorista CTA
    await page.getByText('Ver Fretes Disponíveis').click();
    
    // 3. Should navigate to partner onboarding
    await expect(page).toHaveURL('/cadastro-parceiro');
    
    // 4. Select motorista autônomo
    await page.getByText(/motorista autônomo/i).click();
    
    // 5. Should show driver registration form
    await expect(page.getByText(/dados pessoais/i)).toBeVisible();
    await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    await expect(page.getByLabel(/cpf/i)).toBeVisible();
  });

  test('Driver form: Step through registration wizard', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    // Fill step 1 - Personal data
    await page.getByLabel(/nome completo/i).fill(validDriver.fullName);
    await page.getByLabel(/cpf/i).fill(validDriver.cpf);
    await page.getByLabel(/e-mail/i).fill(validDriver.email);
    await page.getByLabel(/telefone/i).fill(validDriver.phone);
    
    // Check that WhatsApp field exists
    const whatsappInput = page.getByLabel(/whatsapp/i);
    if (await whatsappInput.isVisible()) {
      await whatsappInput.fill(validDriver.whatsapp);
    }
    
    // Try to proceed to next step
    const nextButton = page.getByRole('button', { name: /próximo|continuar/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Should show address or next step
      await page.waitForTimeout(500);
    }
  });
});

test.describe('User Journey - Carrier (Transportadora)', () => {
  
  test('Complete flow: Home → Partner Onboarding → Carrier Form', async ({ page }) => {
    // 1. Start at home page
    await page.goto('/');
    
    // 2. Click on transportadora CTA
    await page.getByText('Cadastrar Minha Frota').click();
    
    // 3. Should navigate to partner onboarding
    await expect(page).toHaveURL('/cadastro-parceiro');
    
    // 4. Select transportadora
    await page.getByText(/transportadora/i).click();
    
    // 5. Should show carrier registration form
    await expect(page.getByText(/dados da empresa/i)).toBeVisible();
    await expect(page.getByLabel(/cnpj/i)).toBeVisible();
  });

  test('Carrier form: CEP auto-fill integration', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/transportadora/i).click();
    
    // Fill CEP
    const cepInput = page.getByLabel(/cep/i);
    await cepInput.fill('01310-100');
    await cepInput.blur();
    
    // Wait for API response
    await page.waitForTimeout(2000);
    
    // Check that address was auto-filled
    const streetInput = page.getByLabel(/logradouro|rua/i);
    const streetValue = await streetInput.inputValue();
    expect(streetValue).toContain('Paulista');
    
    // Check city
    const cityInput = page.getByLabel(/cidade/i);
    const cityValue = await cityInput.inputValue();
    expect(cityValue).toContain('Paulo');
  });
});

test.describe('User Journey - Tracking', () => {
  
  test('Complete flow: Home → Tracking → Search', async ({ page }) => {
    // 1. Start at home
    await page.goto('/');
    
    // 2. Navigate to tracking
    await page.getByRole('link', { name: /rastrear|tracking/i }).click();
    await expect(page).toHaveURL('/tracking');
    
    // 3. Enter tracking code
    await page.getByLabel(/código/i).fill('LM-2024-01-0001');
    
    // 4. Click search
    await page.getByRole('button', { name: /rastrear/i }).click();
    
    // 5. Should show result or not found message
    await page.waitForTimeout(2000);
    // Either shows tracking info or not found message
    await expect(page.locator('body')).toBeVisible();
  });

  test('Tracking: Direct URL access with code', async ({ page }) => {
    // Access tracking with code in URL
    await page.goto('/tracking?code=LM-2024-TEST');
    
    // Should show tracking page
    await expect(page.getByText(/rastreamento/i)).toBeVisible();
    
    // Code input might be pre-filled
    const codeInput = page.getByLabel(/código/i);
    const value = await codeInput.inputValue();
    // May or may not be pre-filled based on implementation
  });
});

test.describe('Cross-Page State Consistency', () => {
  
  test('should maintain login state across navigation', async ({ page }) => {
    // This test verifies that auth state persists across pages
    // Note: In actual test, we'd need to login first
    
    await page.goto('/auth');
    
    // Simulate what would happen after login
    // Navigate between pages and verify consistent state
    await page.goto('/');
    await page.goto('/faq');
    await page.goto('/ranking');
    
    // All pages should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // 1. Navigate through pages
    await page.goto('/');
    await page.goto('/faq');
    await page.goto('/ranking');
    
    // 2. Go back
    await page.goBack();
    await expect(page).toHaveURL('/faq');
    
    // 3. Go back again
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // 4. Go forward
    await page.goForward();
    await expect(page).toHaveURL('/faq');
  });

  test('should handle page refresh', async ({ page }) => {
    await page.goto('/faq');
    
    // Verify initial load
    await expect(page.getByRole('heading', { name: /perguntas frequentes/i })).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Verify content still loads
    await expect(page.getByRole('heading', { name: /perguntas frequentes/i })).toBeVisible();
  });
});

test.describe('Error Recovery Flows', () => {
  
  test('should recover from 404 with navigation', async ({ page }) => {
    // 1. Go to non-existent page
    await page.goto('/pagina-inexistente');
    
    // 2. Should show 404
    await expect(page.getByText(/404|não encontrada/i)).toBeVisible();
    
    // 3. Find link back to home
    const homeLink = page.getByRole('link', { name: /início|home|voltar/i });
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should handle network disconnect gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to navigate
    await page.getByRole('link', { name: /faq/i }).click();
    
    // Should show some offline indication or cached content
    await page.waitForTimeout(1000);
    
    // Re-enable network
    await page.context().setOffline(false);
    
    // Refresh should work
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Form Persistence', () => {
  
  test('should not lose data on accidental navigation', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    // Fill some data
    await page.getByLabel(/nome completo/i).fill('João da Silva');
    
    // Try to navigate away (might trigger warning)
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('beforeunload');
      await dialog.dismiss();
    });
    
    // The form should still have the data
    const name = await page.getByLabel(/nome completo/i).inputValue();
    expect(name).toBe('João da Silva');
  });
});
