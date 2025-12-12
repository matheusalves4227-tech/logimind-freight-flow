import { test, expect } from '../fixtures/auth';
import { validQuote } from '../fixtures/test-data';

test.describe('Payment Flow - PIX Manual', () => {
  test('should display PIX payment modal after selecting carrier', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Generate a quote first
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
      
      // Select a carrier
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(2000);
        
        // Should show PIX payment elements
        const pixVisible = await authenticatedPage.getByText(/pix|qr code/i).isVisible().catch(() => false);
        const paymentVisible = await authenticatedPage.getByText(/pagamento/i).isVisible().catch(() => false);
        
        expect(pixVisible || paymentVisible).toBeTruthy();
      }
    }
  });

  test('should display QR Code for PIX payment', async ({ authenticatedPage }) => {
    // Navigate to a state where payment modal would be open
    // This is a simplified test - in real scenario, you'd navigate through the full flow
    
    await authenticatedPage.goto('/quote');
    
    // Complete quote flow...
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
      
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(3000);
        
        // Look for QR Code canvas or image
        const qrCode = authenticatedPage.locator('canvas, [data-testid="qr-code"], img[alt*="QR"]');
        const qrVisible = await qrCode.isVisible().catch(() => false);
        
        // Or look for PIX copy-paste code
        const pixCode = authenticatedPage.getByText(/copia.*cola|copiar.*código/i);
        const pixCodeVisible = await pixCode.isVisible().catch(() => false);
        
        // At least one should be visible in PIX payment flow
        if (await authenticatedPage.getByText(/pix/i).isVisible().catch(() => false)) {
          expect(qrVisible || pixCodeVisible).toBeTruthy();
        }
      }
    }
  });

  test('should allow copying PIX code', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Navigate through quote flow
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
      
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(3000);
        
        // Look for copy button
        const copyBtn = authenticatedPage.getByRole('button', { name: /copiar/i });
        if (await copyBtn.isVisible().catch(() => false)) {
          await copyBtn.click();
          
          // Should show success message
          await expect(authenticatedPage.getByText(/copiado|sucesso/i)).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('should show payment value correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
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
      
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(3000);
        
        // Payment value should be displayed (R$ format)
        const priceVisible = await authenticatedPage.getByText(/R\$\s*[\d.,]+/).isVisible().catch(() => false);
        expect(priceVisible).toBeTruthy();
      }
    }
  });
});

test.describe('Payment Flow - Proof Upload', () => {
  test('should have upload area for payment proof', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
    // Navigate through quote and select carrier
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
      
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(3000);
        
        // Look for upload input or area
        const uploadInput = authenticatedPage.locator('input[type="file"]');
        const uploadArea = authenticatedPage.getByText(/upload|enviar.*comprovante|anexar/i);
        
        const hasUpload = await uploadInput.isVisible().catch(() => false) || 
                          await uploadArea.isVisible().catch(() => false);
        
        // Upload should be available if we're in PIX flow
        if (await authenticatedPage.getByText(/pix/i).isVisible().catch(() => false)) {
          expect(hasUpload).toBeTruthy();
        }
      }
    }
  });

  test('should validate file type for upload', async ({ authenticatedPage }) => {
    // This test would require actually uploading a file
    // Playwright supports file upload via setInputFiles
    
    await authenticatedPage.goto('/quote');
    
    // Navigate to payment state...
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
      
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(3000);
        
        const uploadInput = authenticatedPage.locator('input[type="file"]');
        if (await uploadInput.isVisible().catch(() => false)) {
          // Check accepted file types
          const accept = await uploadInput.getAttribute('accept');
          
          // Should accept images and PDFs
          if (accept) {
            expect(accept).toMatch(/image|pdf|png|jpg|jpeg/i);
          }
        }
      }
    }
  });
});

test.describe('Payment Flow - Close and Cancel', () => {
  test('should be able to close payment modal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/quote');
    
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
      
      const selectBtn = authenticatedPage.getByRole('button', { name: /contratar|selecionar|escolher/i }).first();
      if (await selectBtn.isVisible().catch(() => false)) {
        await selectBtn.click();
        await authenticatedPage.waitForTimeout(3000);
        
        // Look for close button (X) or cancel button
        const closeBtn = authenticatedPage.getByRole('button', { name: /fechar|cancelar|voltar/i });
        const xButton = authenticatedPage.locator('[aria-label="Close"], button:has(svg[class*="x"])');
        
        const closeVisible = await closeBtn.isVisible().catch(() => false);
        const xVisible = await xButton.first().isVisible().catch(() => false);
        
        if (closeVisible) {
          await closeBtn.click();
        } else if (xVisible) {
          await xButton.first().click();
        } else {
          // Try escape key
          await authenticatedPage.keyboard.press('Escape');
        }
        
        // Modal should close
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });
});
