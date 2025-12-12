import { test, expect } from '@playwright/test';

test.describe('Home Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page correctly', async ({ page }) => {
    // Verify main elements are visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Verify key sections exist
    await expect(page.locator('text=LogiMind')).toBeVisible();
  });

  test('should display triple marketplace cards', async ({ page }) => {
    // Check for the three user type cards
    await expect(page.getByText('Quero Cotação Preditiva')).toBeVisible();
    await expect(page.getByText('Quero Ofertar Meus Fretes')).toBeVisible();
    await expect(page.getByText('Quero Encontrar Fretes')).toBeVisible();
  });

  test('should navigate to quote page from embarcador card', async ({ page }) => {
    await page.getByText('Cote e Economize Agora').click();
    
    // Should redirect to auth if not logged in
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

  test('should have mobile responsive navigation', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check hamburger menu is visible on mobile
      await expect(page.locator('[data-testid="mobile-menu-trigger"]')).toBeVisible();
      
      // Open mobile menu
      await page.locator('[data-testid="mobile-menu-trigger"]').click();
      
      // Verify menu items
      await expect(page.getByRole('button', { name: /início/i })).toBeVisible();
    }
  });

  test('should display footer with all links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check important footer links
    await expect(footer.getByText('FAQ')).toBeVisible();
    await expect(footer.getByText('Ranking')).toBeVisible();
  });
});

test.describe('Home Page - SEO Verification', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    const title = await page.title();
    expect(title).toContain('LogiMarket');
    
    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.length).toBeLessThanOrEqual(160);
    
    // Check canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
  });

  test('should have structured data', async ({ page }) => {
    await page.goto('/');
    
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
    expect(structuredData).toBeTruthy();
    
    const parsed = JSON.parse(structuredData!);
    expect(parsed['@type']).toBe('Organization');
  });
});
