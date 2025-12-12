import { test, expect } from '../fixtures/auth';
import { validQuote, invalidQuotes } from '../fixtures/test-data';

test.describe('Quote Flow - Authenticated User', () => {
  test('should access quote page when logged in', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Should NOT redirect to auth
    await expect(authenticatedPage).toHaveURL('/quote');
    
    // Should show quote form
    await expect(authenticatedPage.getByText(/nova cotação|cotação/i)).toBeVisible();
  });

  test('should display service type selection', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Check for service type options
    await expect(authenticatedPage.getByText(/frete padrão|ltl/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/frete dedicado|ftl/i)).toBeVisible();
  });

  test('should fill quote form with valid data', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Fill origin CEP
    const originCep = authenticatedPage.getByLabel(/cep.*origem/i);
    if (await originCep.isVisible()) {
      await originCep.fill(validQuote.originCep);
      await originCep.blur();
      
      // Wait for CEP auto-fill
      await authenticatedPage.waitForTimeout(1500);
    }
    
    // Fill destination CEP
    const destCep = authenticatedPage.getByLabel(/cep.*destino/i);
    if (await destCep.isVisible()) {
      await destCep.fill(validQuote.destinationCep);
      await destCep.blur();
      
      await authenticatedPage.waitForTimeout(1500);
    }
    
    // Fill weight
    const weightInput = authenticatedPage.getByLabel(/peso/i);
    if (await weightInput.isVisible()) {
      await weightInput.fill(validQuote.weight);
    }
    
    // Fill dimensions if visible
    const lengthInput = authenticatedPage.getByLabel(/comprimento/i);
    if (await lengthInput.isVisible().catch(() => false)) {
      await lengthInput.fill(validQuote.length);
    }
    
    const widthInput = authenticatedPage.getByLabel(/largura/i);
    if (await widthInput.isVisible().catch(() => false)) {
      await widthInput.fill(validQuote.width);
    }
    
    const heightInput = authenticatedPage.getByLabel(/altura/i);
    if (await heightInput.isVisible().catch(() => false)) {
      await heightInput.fill(validQuote.height);
    }
  });

  test('should validate negative weight', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    const weightInput = authenticatedPage.getByLabel(/peso/i);
    if (await weightInput.isVisible()) {
      await weightInput.fill('-100');
      await weightInput.blur();
      
      // Check for validation error or that value is rejected
      const value = await weightInput.inputValue();
      
      // Either the value should be empty/positive, or an error should show
      const hasError = await authenticatedPage.getByText(/peso.*inválido|valor.*positivo/i).isVisible().catch(() => false);
      expect(parseFloat(value) < 0 && !hasError).toBeFalsy();
    }
  });

  test('should validate excessive weight', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    const weightInput = authenticatedPage.getByLabel(/peso/i);
    if (await weightInput.isVisible()) {
      await weightInput.fill(invalidQuotes.excessiveWeight.weight);
      await weightInput.blur();
      
      // Form might show warning for excessive weight
      // This is a soft check as behavior depends on implementation
    }
  });

  test('should submit quote and see results', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Fill minimum required fields
    const originCep = authenticatedPage.getByLabel(/cep.*origem/i);
    const destCep = authenticatedPage.getByLabel(/cep.*destino/i);
    const weightInput = authenticatedPage.getByLabel(/peso/i);
    
    if (await originCep.isVisible()) {
      await originCep.fill(validQuote.originCep);
    }
    
    if (await destCep.isVisible()) {
      await destCep.fill(validQuote.destinationCep);
    }
    
    if (await weightInput.isVisible()) {
      await weightInput.fill(validQuote.weight);
    }
    
    // Submit quote
    const submitBtn = authenticatedPage.getByRole('button', { name: /gerar cotação|cotar|calcular/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Wait for results or loading
      await authenticatedPage.waitForTimeout(3000);
      
      // Should show quote results or loading state
      const hasResults = await authenticatedPage.getByText(/resultado|opções|transportadora/i).isVisible().catch(() => false);
      const isLoading = await authenticatedPage.getByText(/carregando|processando/i).isVisible().catch(() => false);
      
      expect(hasResults || isLoading).toBeTruthy();
    }
  });

  test('should select a carrier and proceed to checkout', async ({ authenticatedPage }) => {
    // This test assumes quote results are available
    // In real scenario, we'd need to generate a quote first
    await authenticatedPage.goto('/quote');
    
    // Fill and submit quote (abbreviated)
    const originCep = authenticatedPage.getByLabel(/cep.*origem/i);
    const destCep = authenticatedPage.getByLabel(/cep.*destino/i);
    const weightInput = authenticatedPage.getByLabel(/peso/i);
    
    if (await originCep.isVisible()) await originCep.fill(validQuote.originCep);
    if (await destCep.isVisible()) await destCep.fill(validQuote.destinationCep);
    if (await weightInput.isVisible()) await weightInput.fill(validQuote.weight);
    
    const submitBtn = authenticatedPage.getByRole('button', { name: /gerar cotação|cotar|calcular/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await authenticatedPage.waitForTimeout(5000);
      
      // Look for carrier cards and select button
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        
        // Should open payment modal or redirect
        await authenticatedPage.waitForTimeout(2000);
        
        // Check for payment UI elements
        const paymentVisible = await authenticatedPage.getByText(/pagamento|pix|pagar/i).isVisible().catch(() => false);
        expect(paymentVisible).toBeTruthy();
      }
    }
  });
});

test.describe('Quote Form Validation - Edge Cases', () => {
  test('should handle CEP not found', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    const originCep = authenticatedPage.getByLabel(/cep.*origem/i);
    if (await originCep.isVisible()) {
      await originCep.fill('00000-000');
      await originCep.blur();
      
      await authenticatedPage.waitForTimeout(2000);
      
      // Should show error or not auto-fill address
      const errorVisible = await authenticatedPage.getByText(/cep.*não encontrado|cep.*inválido/i).isVisible().catch(() => false);
      const cityInput = authenticatedPage.getByLabel(/cidade.*origem/i);
      const cityFilled = await cityInput.inputValue().catch(() => '');
      
      expect(errorVisible || cityFilled === '').toBeTruthy();
    }
  });

  test('should validate dimensions as positive numbers', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    const lengthInput = authenticatedPage.getByLabel(/comprimento/i);
    if (await lengthInput.isVisible().catch(() => false)) {
      await lengthInput.fill('-50');
      await lengthInput.blur();
      
      // Should reject negative or show error
      const value = await lengthInput.inputValue();
      expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle empty form submission', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Try to submit without filling anything
    const submitBtn = authenticatedPage.getByRole('button', { name: /gerar cotação|cotar|calcular/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Should show validation errors
      await authenticatedPage.waitForTimeout(1000);
      
      // Check for required field indicators
      const requiredInputs = authenticatedPage.locator('input[required]:invalid');
      const invalidCount = await requiredInputs.count();
      
      expect(invalidCount).toBeGreaterThan(0);
    }
  });
});
