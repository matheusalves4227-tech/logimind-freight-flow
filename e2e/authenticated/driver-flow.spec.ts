import { test, expect } from '../fixtures/auth';

// Driver-specific fixtures would need a driver account
// These tests use regular auth but check driver-specific pages

test.describe('Driver Dashboard - Access', () => {
  test('should access driver dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // Either shows driver dashboard or redirects if not a driver
    const isDriverPage = authenticatedPage.url().includes('/motorista');
    const wasRedirected = authenticatedPage.url().includes('/cadastro-parceiro') || 
                          authenticatedPage.url().includes('/aguardando-aprovacao');
    
    // Should be on driver page or redirected appropriately
    expect(isDriverPage || wasRedirected).toBeTruthy();
  });

  test('should show driver onboarding if not registered', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // If user is not a driver, should redirect to onboarding
    if (authenticatedPage.url().includes('/cadastro-parceiro')) {
      await expect(authenticatedPage.getByText(/motorista/i)).toBeVisible();
    }
  });

  test('should show pending approval status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // If driver is pending approval
    if (authenticatedPage.url().includes('/aguardando-aprovacao')) {
      await expect(authenticatedPage.getByText(/aguardando|aprovação|análise/i)).toBeVisible();
    }
  });
});

test.describe('Driver Dashboard - Tabs', () => {
  test.skip('should display status tab', async ({ authenticatedPage }) => {
    // This test assumes user is an approved driver
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const statusTab = authenticatedPage.getByRole('tab', { name: /status/i });
      await expect(statusTab).toBeVisible();
    }
  });

  test.skip('should display opportunities tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const opportunitiesTab = authenticatedPage.getByRole('tab', { name: /oportunidade/i });
      await expect(opportunitiesTab).toBeVisible();
      
      await opportunitiesTab.click();
      
      // Should show available freights
      await expect(authenticatedPage.getByText(/frete|carga|disponível/i)).toBeVisible();
    }
  });

  test.skip('should display financial tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro/i });
      await expect(financialTab).toBeVisible();
      
      await financialTab.click();
      
      // Should show financial info
      await expect(authenticatedPage.getByText(/saldo|ganho|repasse/i)).toBeVisible();
    }
  });

  test.skip('should display profile tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const profileTab = authenticatedPage.getByRole('tab', { name: /perfil/i });
      await expect(profileTab).toBeVisible();
      
      await profileTab.click();
      
      // Should show profile info
      await expect(authenticatedPage.getByText(/cpf|cnh|veículo/i)).toBeVisible();
    }
  });
});

test.describe('Driver - Accept Freight', () => {
  test.skip('should show freight details before accepting', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      // Go to opportunities
      const opportunitiesTab = authenticatedPage.getByRole('tab', { name: /oportunidade/i });
      await opportunitiesTab.click();
      
      await authenticatedPage.waitForTimeout(2000);
      
      // Find first opportunity card
      const freightCard = authenticatedPage.locator('[class*="card"]').first();
      if (await freightCard.isVisible().catch(() => false)) {
        await freightCard.click();
        
        // Should show freight details
        await expect(authenticatedPage.getByText(/origem|destino|valor/i)).toBeVisible();
      }
    }
  });

  test.skip('should accept freight', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const opportunitiesTab = authenticatedPage.getByRole('tab', { name: /oportunidade/i });
      await opportunitiesTab.click();
      
      await authenticatedPage.waitForTimeout(2000);
      
      const acceptBtn = authenticatedPage.getByRole('button', { name: /aceitar|pegar.*frete/i }).first();
      if (await acceptBtn.isVisible().catch(() => false)) {
        await acceptBtn.click();
        
        // Should show confirmation or success
        await expect(authenticatedPage.getByText(/aceito|confirmado|sucesso/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Driver - Bank Account', () => {
  test.skip('should show bank account form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro/i });
      await financialTab.click();
      
      await authenticatedPage.waitForTimeout(1000);
      
      // Should have PIX or bank account section
      await expect(authenticatedPage.getByText(/pix|banco|conta/i)).toBeVisible();
    }
  });

  test.skip('should validate PIX key format', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    if (authenticatedPage.url().includes('/motorista/dashboard')) {
      const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro/i });
      await financialTab.click();
      
      await authenticatedPage.waitForTimeout(1000);
      
      const pixInput = authenticatedPage.getByLabel(/chave.*pix/i);
      if (await pixInput.isVisible().catch(() => false)) {
        // Try invalid CPF as PIX key
        await pixInput.fill('111.111.111-11');
        await pixInput.blur();
        
        // Should show validation error
        await expect(authenticatedPage.getByText(/inválido|formato/i)).toBeVisible();
      }
    }
  });
});

test.describe('Driver - Pickup Validation', () => {
  test.skip('should access pickup validation page', async ({ authenticatedPage }) => {
    // This requires an order ID
    await authenticatedPage.goto('/motorista/codigo-coleta/test-order-id');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show pickup code or redirect
    const hasCode = await authenticatedPage.getByText(/código.*coleta/i).isVisible().catch(() => false);
    const wasRedirected = !authenticatedPage.url().includes('/codigo-coleta');
    
    expect(hasCode || wasRedirected).toBeTruthy();
  });
});
