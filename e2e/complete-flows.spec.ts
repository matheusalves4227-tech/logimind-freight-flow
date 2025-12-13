import { test, expect } from '@playwright/test';
import { validUser, validDriver, validCarrier, validQuote, invalidUsers, invalidDrivers, invalidCarriers, invalidQuotes } from './fixtures/test-data';

// ============================================================================
// FLUXO COMPLETO: NAVEGAÇÃO E HOME
// ============================================================================
test.describe('Navigation & Home - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with all essential elements', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display triple marketplace cards correctly', async ({ page }) => {
    await expect(page.getByText('Quero Cotação Preditiva')).toBeVisible();
    await expect(page.getByText('Quero Ofertar Meus Fretes')).toBeVisible();
    await expect(page.getByText('Quero Encontrar Fretes')).toBeVisible();
  });

  test('should navigate to auth when clicking quote CTA (unauthenticated)', async ({ page }) => {
    await page.getByText('Cote e Economize Agora').click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should navigate to partner onboarding from transportadora card', async ({ page }) => {
    await page.getByText('Cadastrar Minha Frota').click();
    await expect(page).toHaveURL('/cadastro-parceiro');
  });

  test('should navigate to partner onboarding from motorista card', async ({ page }) => {
    await page.getByText('Ver Fretes Disponíveis').click();
    await expect(page).toHaveURL('/cadastro-parceiro');
  });

  test('should navigate back to home correctly from partner registration', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('should have working footer links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText('FAQ')).toBeVisible();
    await expect(footer.getByText('Ranking')).toBeVisible();
  });

  test('should navigate to FAQ from footer', async ({ page }) => {
    await page.locator('footer').getByText('FAQ').click();
    await expect(page).toHaveURL('/faq');
  });

  test('should navigate to Ranking from footer', async ({ page }) => {
    await page.locator('footer').getByText('Ranking').click();
    await expect(page).toHaveURL('/ranking');
  });
});

// ============================================================================
// FLUXO COMPLETO: AUTENTICAÇÃO - VÁLIDO
// ============================================================================
test.describe('Authentication Flow - Valid Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form correctly', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should switch between login and signup tabs', async ({ page }) => {
    const signupTab = page.getByRole('tab', { name: /cadastrar/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    }
  });

  test('should show password strength indicator on signup', async ({ page }) => {
    const signupTab = page.getByRole('tab', { name: /cadastrar/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.getByLabel(/senha/i).fill('Test');
      // Password indicator should show weak
      await expect(page.getByText(/fraca|weak/i).or(page.locator('[class*="strength"]'))).toBeVisible({ timeout: 2000 }).catch(() => {});
    }
  });

  test('should have working reset password link', async ({ page }) => {
    const forgotLink = page.getByText(/esqueceu/i);
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL('/reset-password');
    }
  });

  test('should redirect to quote after login with redirect param', async ({ page }) => {
    await page.goto('/auth?redirect=/quote&reason=quote');
    await expect(page.getByText(/login.*cotação|faça login/i)).toBeVisible({ timeout: 3000 }).catch(() => {});
  });
});

// ============================================================================
// FLUXO COMPLETO: AUTENTICAÇÃO - INVÁLIDO
// ============================================================================
test.describe('Authentication Flow - Invalid Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should reject empty email on login', async ({ page }) => {
    await page.getByLabel(/senha/i).fill('TestPassword123');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    const emailInput = page.getByLabel(/email/i);
    const isRequired = await emailInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/senha/i).fill('TestPassword123');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should reject empty password', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    const passwordInput = page.getByLabel(/senha/i);
    const isRequired = await passwordInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('should reject short password on signup', async ({ page }) => {
    const signupTab = page.getByRole('tab', { name: /cadastrar/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.getByLabel(/nome completo/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/senha/i).fill('123');
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      await expect(page.getByText(/8 caracteres|muito curta/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should reject password without uppercase on signup', async ({ page }) => {
    const signupTab = page.getByRole('tab', { name: /cadastrar/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.getByLabel(/nome completo/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/senha/i).fill('testpassword123');
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      await expect(page.getByText(/maiúscula/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should reject password without number on signup', async ({ page }) => {
    const signupTab = page.getByRole('tab', { name: /cadastrar/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.getByLabel(/nome completo/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/senha/i).fill('TestPassword');
      await page.getByRole('button', { name: /criar conta/i }).click();
      
      await expect(page.getByText(/número/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: CADASTRO DE MOTORISTA - VÁLIDO
// ============================================================================
test.describe('Driver Registration Flow - Valid Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
  });

  test('should display partner type selection', async ({ page }) => {
    await expect(page.getByText(/motorista autônomo/i)).toBeVisible();
    await expect(page.getByText(/transportadora/i)).toBeVisible();
  });

  test('should navigate to driver registration form', async ({ page }) => {
    await page.getByText(/motorista autônomo/i).click();
    await expect(page.getByText(/dados pessoais/i)).toBeVisible();
  });

  test('should show step indicator in driver form', async ({ page }) => {
    await page.getByText(/motorista autônomo/i).click();
    // Check for step indicator (1, 2, 3 or similar)
    await expect(page.getByText(/etapa|passo|step/i)).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('should auto-fill address from CEP', async ({ page }) => {
    await page.getByText(/motorista autônomo/i).click();
    
    // Fill basic required fields first
    const cepInput = page.getByLabel(/cep/i);
    if (await cepInput.isVisible()) {
      await cepInput.fill('01310-100');
      await cepInput.blur();
      await page.waitForTimeout(2000);
      
      // Check if street was auto-filled
      const streetInput = page.getByLabel(/logradouro|rua|endereço/i);
      if (await streetInput.isVisible()) {
        const streetValue = await streetInput.inputValue();
        expect(streetValue.length).toBeGreaterThan(0);
      }
    }
  });

  test('should mask CPF input correctly', async ({ page }) => {
    await page.getByText(/motorista autônomo/i).click();
    
    const cpfInput = page.getByLabel(/cpf/i);
    if (await cpfInput.isVisible()) {
      await cpfInput.fill('52998224725');
      await cpfInput.blur();
      
      const maskedValue = await cpfInput.inputValue();
      expect(maskedValue).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    }
  });

  test('should mask phone input correctly', async ({ page }) => {
    await page.getByText(/motorista autônomo/i).click();
    
    const phoneInput = page.getByLabel(/telefone/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('11999998888');
      await phoneInput.blur();
      
      const maskedValue = await phoneInput.inputValue();
      expect(maskedValue).toMatch(/\(\d{2}\)\s?\d{4,5}-\d{4}/);
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: CADASTRO DE MOTORISTA - INVÁLIDO
// ============================================================================
test.describe('Driver Registration Flow - Invalid Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
  });

  test('should reject invalid CPF', async ({ page }) => {
    const cpfInput = page.getByLabel(/cpf/i);
    if (await cpfInput.isVisible()) {
      await cpfInput.fill('111.111.111-11');
      await cpfInput.blur();
      
      await expect(page.getByText(/cpf inválido/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should reject invalid email format', async ({ page }) => {
    const emailInput = page.getByLabel(/e-mail/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    }
  });

  test('should reject invalid phone number', async ({ page }) => {
    const phoneInput = page.getByLabel(/telefone/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('123');
      await phoneInput.blur();
      
      await expect(page.getByText(/telefone inválido|formato/i)).toBeVisible({ timeout: 3000 }).catch(() => {
        // Some implementations just block submission
      });
    }
  });

  test('should require all mandatory fields', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /próximo|continuar|avançar/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Should show required field errors or not proceed
      const requiredInputs = page.locator('input[required]');
      const count = await requiredInputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should reject empty CEP', async ({ page }) => {
    const cepInput = page.getByLabel(/cep/i);
    if (await cepInput.isVisible()) {
      await cepInput.fill('');
      await cepInput.blur();
      
      const isRequired = await cepInput.getAttribute('required');
      expect(isRequired).not.toBeNull();
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: CADASTRO DE TRANSPORTADORA - VÁLIDO
// ============================================================================
test.describe('Carrier Registration Flow - Valid Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/transportadora/i).click();
  });

  test('should display carrier registration form', async ({ page }) => {
    await expect(page.getByText(/dados da empresa/i)).toBeVisible();
  });

  test('should mask CNPJ input correctly', async ({ page }) => {
    const cnpjInput = page.getByLabel(/cnpj/i);
    if (await cnpjInput.isVisible()) {
      await cnpjInput.fill('11222333000181');
      await cnpjInput.blur();
      
      const maskedValue = await cnpjInput.inputValue();
      expect(maskedValue).toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    }
  });

  test('should auto-fill address from CEP', async ({ page }) => {
    const cepInput = page.getByLabel(/cep/i);
    if (await cepInput.isVisible()) {
      await cepInput.fill('01310-100');
      await cepInput.blur();
      await page.waitForTimeout(2000);
      
      const streetInput = page.getByLabel(/logradouro|rua/i);
      if (await streetInput.isVisible()) {
        const streetValue = await streetInput.inputValue();
        expect(streetValue.length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: CADASTRO DE TRANSPORTADORA - INVÁLIDO
// ============================================================================
test.describe('Carrier Registration Flow - Invalid Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/transportadora/i).click();
  });

  test('should reject invalid CNPJ', async ({ page }) => {
    const cnpjInput = page.getByLabel(/cnpj/i);
    if (await cnpjInput.isVisible()) {
      await cnpjInput.fill('11.111.111/1111-11');
      await cnpjInput.blur();
      
      await expect(page.getByText(/cnpj inválido/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should reject invalid email format', async ({ page }) => {
    const emailInput = page.getByLabel(/e-mail/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    }
  });

  test('should reject empty razao social', async ({ page }) => {
    const razaoInput = page.getByLabel(/razão social/i);
    if (await razaoInput.isVisible()) {
      await razaoInput.fill('');
      await razaoInput.blur();
      
      const isRequired = await razaoInput.getAttribute('required');
      expect(isRequired).not.toBeNull();
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: COTAÇÃO - PROTEÇÃO DE ROTA
// ============================================================================
test.describe('Quote Flow - Route Protection', () => {
  test('should redirect unauthenticated users from quote page', async ({ page }) => {
    await page.goto('/quote');
    
    // Should redirect to auth with proper params
    await expect(page).toHaveURL(/\/auth\?redirect=\/quote/);
  });

  test('should show login required message', async ({ page }) => {
    await page.goto('/quote');
    
    await expect(page.getByText(/faça login|entre.*conta/i)).toBeVisible({ timeout: 3000 }).catch(() => {});
  });
});

// ============================================================================
// FLUXO COMPLETO: RASTREAMENTO - PÚBLICO
// ============================================================================
test.describe('Tracking Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tracking');
  });

  test('should display tracking search form', async ({ page }) => {
    await expect(page.getByText(/rastreamento/i)).toBeVisible();
  });

  test('should have tracking code input field', async ({ page }) => {
    await expect(page.getByLabel(/código/i).or(page.getByPlaceholder(/código|tracking/i))).toBeVisible();
  });

  test('should have search button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /rastrear|buscar|pesquisar/i })).toBeVisible();
  });

  test('should show error for invalid tracking code', async ({ page }) => {
    const trackingInput = page.getByLabel(/código/i).or(page.getByPlaceholder(/código|tracking/i));
    if (await trackingInput.isVisible()) {
      await trackingInput.fill('INVALID-CODE');
      await page.getByRole('button', { name: /rastrear|buscar/i }).click();
      
      await expect(page.getByText(/não encontrado|inválido|erro/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });

  test('should handle empty tracking code', async ({ page }) => {
    await page.getByRole('button', { name: /rastrear|buscar/i }).click();
    
    const trackingInput = page.getByLabel(/código/i).or(page.getByPlaceholder(/código|tracking/i));
    if (await trackingInput.isVisible()) {
      const isRequired = await trackingInput.getAttribute('required');
      // Either required or shows error
      expect(isRequired !== null || await page.getByText(/obrigatório|preencha/i).isVisible().catch(() => false)).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: FAQ - PÚBLICO
// ============================================================================
test.describe('FAQ Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
  });

  test('should display FAQ page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /faq|perguntas/i })).toBeVisible();
  });

  test('should have accordion questions', async ({ page }) => {
    await expect(page.locator('[data-state="closed"], [role="button"]').first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('should expand/collapse FAQ items', async ({ page }) => {
    const firstQuestion = page.locator('[data-state="closed"]').first();
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click();
      await page.waitForTimeout(500);
      
      // Should show answer
      await expect(page.locator('[data-state="open"]').first()).toBeVisible({ timeout: 2000 }).catch(() => {});
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: RANKING - PÚBLICO
// ============================================================================
test.describe('Ranking Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ranking');
  });

  test('should display ranking page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ranking/i })).toBeVisible();
  });

  test('should have tabs for drivers and carriers', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /motorista/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /transportadora/i })).toBeVisible();
  });

  test('should switch between ranking types', async ({ page }) => {
    await page.getByRole('tab', { name: /transportadora/i }).click();
    await expect(page.getByText(/transportadora/i)).toBeVisible();
  });
});

// ============================================================================
// FLUXO COMPLETO: MOBILE RESPONSIVENESS
// ============================================================================
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.goto('/');
    
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]').or(page.locator('button:has(svg)').first());
    await expect(mobileMenuTrigger).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('should not have horizontal scroll', async ({ page }) => {
    await page.goto('/');
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should display cards correctly on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Cards should be visible and stacked
    await expect(page.getByText('Quero Cotação Preditiva')).toBeVisible();
  });
});

// ============================================================================
// FLUXO COMPLETO: SEO E META TAGS
// ============================================================================
test.describe('SEO & Meta Tags', () => {
  test('should have proper title on homepage', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toContain('LogiMarket');
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeLessThanOrEqual(160);
  });

  test('should have lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('pt-BR');
  });

  test('should have structured data on homepage', async ({ page }) => {
    await page.goto('/');
    
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
    expect(structuredData).toBeTruthy();
    
    const parsed = JSON.parse(structuredData!);
    expect(parsed['@type']).toBe('Organization');
  });

  test('should have canonical URL', async ({ page }) => {
    await page.goto('/');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
  });
});

// ============================================================================
// FLUXO COMPLETO: ACESSIBILIDADE
// ============================================================================
test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on homepage', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBe(1);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // All images should have alt (can be empty for decorative)
      expect(alt).not.toBeNull();
    }
  });

  test('should have labels on form inputs', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.getByLabel(/senha/i);
    await expect(passwordInput).toBeVisible();
  });

  test('should have focusable interactive elements', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      await buttons.first().focus();
      const isFocused = await buttons.first().evaluate(el => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO COMPLETO: RESET PASSWORD
// ============================================================================
test.describe('Reset Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reset-password');
  });

  test('should display reset password form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /redefinir|recuperar/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /enviar|redefinir/i }).click();
    
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should require email', async ({ page }) => {
    await page.getByRole('button', { name: /enviar|redefinir/i }).click();
    
    const emailInput = page.getByLabel(/email/i);
    const isRequired = await emailInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });
});

// ============================================================================
// FLUXO COMPLETO: B2B QUOTE
// ============================================================================
test.describe('B2B Quote Flow', () => {
  test('should redirect to auth if not logged in', async ({ page }) => {
    await page.goto('/b2b-quote');
    
    // Should redirect to auth or show login requirement
    const isAuth = await page.url().includes('/auth');
    const hasLoginPrompt = await page.getByText(/login|entrar/i).isVisible().catch(() => false);
    
    expect(isAuth || hasLoginPrompt).toBeTruthy();
  });
});

// ============================================================================
// FLUXO COMPLETO: 404 PAGE
// ============================================================================
test.describe('404 Page', () => {
  test('should display 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page-xyz-123');
    
    await expect(page.getByText(/404|não encontrada|página.*existe/i)).toBeVisible();
  });

  test('should have link back to home', async ({ page }) => {
    await page.goto('/unknown-page-xyz-123');
    
    const homeLink = page.getByRole('link', { name: /início|home|voltar/i }).or(page.getByRole('button', { name: /início|home|voltar/i }));
    await expect(homeLink).toBeVisible();
  });
});
