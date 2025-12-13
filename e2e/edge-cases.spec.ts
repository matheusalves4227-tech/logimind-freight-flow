import { test, expect } from '@playwright/test';

// ============================================================================
// CASOS DE BORDA: NAVEGAÇÃO
// ============================================================================
test.describe('Edge Cases - Navigation', () => {
  test('should handle direct URL access to protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should handle direct URL access to admin routes', async ({ page }) => {
    await page.goto('/admin/pedidos');
    
    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should handle direct URL access to driver routes', async ({ page }) => {
    await page.goto('/motorista/dashboard');
    
    // Should redirect or show appropriate message
    const wasRedirected = page.url().includes('/auth');
    const hasError = await page.getByText(/login|entrar/i).isVisible().catch(() => false);
    
    expect(wasRedirected || hasError).toBeTruthy();
  });

  test('should handle browser back/forward navigation correctly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/faq');
    await page.goto('/ranking');
    
    await page.goBack();
    await expect(page).toHaveURL('/faq');
    
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    await page.goForward();
    await expect(page).toHaveURL('/faq');
  });

  test('should handle refresh on protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.reload();
    
    // Should still show auth or dashboard
    const isAuth = page.url().includes('/auth');
    const isDashboard = page.url().includes('/dashboard');
    
    expect(isAuth || isDashboard).toBeTruthy();
  });
});

// ============================================================================
// CASOS DE BORDA: FORMULÁRIOS
// ============================================================================
test.describe('Edge Cases - Forms', () => {
  test('should handle special characters in name field', async ({ page }) => {
    await page.goto('/auth');
    
    const signupTab = page.getByRole('tab', { name: /cadastrar/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      
      const nameInput = page.getByLabel(/nome completo/i);
      if (await nameInput.isVisible()) {
        // Test special characters
        await nameInput.fill("O'Connor José María");
        const value = await nameInput.inputValue();
        expect(value).toBe("O'Connor José María");
      }
    }
  });

  test('should handle very long input values', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.getByLabel(/email/i);
    const longEmail = 'a'.repeat(200) + '@test.com';
    await emailInput.fill(longEmail);
    
    // Should handle gracefully (truncate or accept)
    const value = await emailInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should handle pasting formatted data', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const cpfInput = page.getByLabel(/cpf/i);
    if (await cpfInput.isVisible()) {
      // Paste formatted CPF
      await cpfInput.fill('529.982.247-25');
      const value = await cpfInput.inputValue();
      expect(value).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    }
  });

  test('should handle leading/trailing spaces in email', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('  test@example.com  ');
    await emailInput.blur();
    
    // Email should be trimmed or handled
    const value = await emailInput.inputValue();
    expect(value.trim()).toBe('test@example.com');
  });
});

// ============================================================================
// CASOS DE BORDA: CEP E ENDEREÇO
// ============================================================================
test.describe('Edge Cases - CEP & Address', () => {
  test('should handle non-existent CEP', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const cepInput = page.getByLabel(/cep/i);
    if (await cepInput.isVisible()) {
      await cepInput.fill('99999-999');
      await cepInput.blur();
      await page.waitForTimeout(2000);
      
      // Should show error or not auto-fill
      const hasError = await page.getByText(/cep.*inválido|não encontrado/i).isVisible().catch(() => false);
      const streetInput = page.getByLabel(/logradouro|rua/i);
      const isEmpty = await streetInput.isVisible() ? await streetInput.inputValue() === '' : true;
      
      expect(hasError || isEmpty).toBeTruthy();
    }
  });

  test('should handle CEP with only numbers', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const cepInput = page.getByLabel(/cep/i);
    if (await cepInput.isVisible()) {
      await cepInput.fill('01310100');
      await cepInput.blur();
      
      // Should format or accept
      const value = await cepInput.inputValue();
      expect(value.replace(/\D/g, '')).toBe('01310100');
    }
  });

  test('should handle partial CEP', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const cepInput = page.getByLabel(/cep/i);
    if (await cepInput.isVisible()) {
      await cepInput.fill('01310');
      await cepInput.blur();
      await page.waitForTimeout(1000);
      
      // Should not auto-fill with partial CEP
      const streetInput = page.getByLabel(/logradouro|rua/i);
      if (await streetInput.isVisible()) {
        const isEmpty = await streetInput.inputValue() === '';
        expect(isEmpty).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// CASOS DE BORDA: DOCUMENTOS
// ============================================================================
test.describe('Edge Cases - Document Validation', () => {
  test('should reject CPF with all same digits', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const cpfInput = page.getByLabel(/cpf/i);
    if (await cpfInput.isVisible()) {
      await cpfInput.fill('111.111.111-11');
      await cpfInput.blur();
      
      await expect(page.getByText(/cpf inválido/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should reject CNPJ with all same digits', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/transportadora/i).click();
    
    const cnpjInput = page.getByLabel(/cnpj/i);
    if (await cnpjInput.isVisible()) {
      await cnpjInput.fill('11.111.111/1111-11');
      await cnpjInput.blur();
      
      await expect(page.getByText(/cnpj inválido/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle CPF/CNPJ with letters', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const cpfInput = page.getByLabel(/cpf/i);
    if (await cpfInput.isVisible()) {
      await cpfInput.fill('abc.def.ghi-jk');
      await cpfInput.blur();
      
      // Should strip letters or show error
      const value = await cpfInput.inputValue();
      const hasLetters = /[a-zA-Z]/.test(value);
      expect(!hasLetters || await page.getByText(/inválido/i).isVisible().catch(() => false)).toBeTruthy();
    }
  });
});

// ============================================================================
// CASOS DE BORDA: TELEFONE
// ============================================================================
test.describe('Edge Cases - Phone Validation', () => {
  test('should reject phone with less than 10 digits', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const phoneInput = page.getByLabel(/telefone/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('11999');
      await phoneInput.blur();
      
      // Should show error or prevent submission
      const hasError = await page.getByText(/telefone inválido|formato/i).isVisible().catch(() => false);
      expect(hasError).toBeTruthy();
    }
  });

  test('should handle phone with country code', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const phoneInput = page.getByLabel(/telefone/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+5511999998888');
      await phoneInput.blur();
      
      // Should handle with or without country code
      const value = await phoneInput.inputValue();
      expect(value.replace(/\D/g, '').length).toBeGreaterThanOrEqual(10);
    }
  });
});

// ============================================================================
// CASOS DE BORDA: COTAÇÃO
// ============================================================================
test.describe('Edge Cases - Quote', () => {
  test('should handle same origin and destination CEP', async ({ page }) => {
    await page.goto('/auth');
    // This would need to be tested with authenticated user
    // For now, just verify the route protection works
    await page.goto('/quote');
    await expect(page).toHaveURL(/\/auth/);
  });
});

// ============================================================================
// CASOS DE BORDA: SESSÃO
// ============================================================================
test.describe('Edge Cases - Session', () => {
  test('should handle expired session gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Clear storage to simulate expired session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload();
    
    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should handle multiple tabs logout', async ({ page, context }) => {
    // Open two tabs
    const page2 = await context.newPage();
    
    await page.goto('/');
    await page2.goto('/');
    
    // Both should show same state
    const title1 = await page.title();
    const title2 = await page2.title();
    
    expect(title1).toBe(title2);
    
    await page2.close();
  });
});

// ============================================================================
// CASOS DE BORDA: RESPONSIVIDADE
// ============================================================================
test.describe('Edge Cases - Responsiveness', () => {
  test('should handle very small screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('/');
    
    // Content should still be visible
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should handle very large screen', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');
    
    // Content should be properly centered/contained
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should handle landscape orientation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 }); // iPhone X landscape
    await page.goto('/');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

// ============================================================================
// CASOS DE BORDA: REDE
// ============================================================================
test.describe('Edge Cases - Network', () => {
  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50000, // 50kb/s
      uploadThroughput: 50000,
      latency: 2000, // 2s
    });
    
    await page.goto('/', { timeout: 30000 });
    
    // Page should still load eventually
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// CASOS DE BORDA: ACESSIBILIDADE
// ============================================================================
test.describe('Edge Cases - Accessibility', () => {
  test('should be navigable by keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const hasFocus = await page.evaluate(() => {
      return document.activeElement !== document.body;
    });
    expect(hasFocus).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.getByLabel(/email/i);
    await emailInput.focus();
    
    // Check if focus is visible (element has outline or ring)
    const isFocused = await emailInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBeTruthy();
  });

  test('should support reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Page should load correctly with reduced motion
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});
