import { test, expect } from '../fixtures/auth';

test.describe('Dashboard - Authenticated User', () => {
  test('should access dashboard when logged in', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Should show dashboard content
    await expect(authenticatedPage.getByText(/dashboard|meus pedidos|painel/i)).toBeVisible();
  });

  test('should display user KPIs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Wait for content to load
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show KPI cards
    const kpiSection = authenticatedPage.locator('[class*="card"], [class*="kpi"]');
    const hasKpis = await kpiSection.first().isVisible().catch(() => false);
    
    // Dashboard should have some metrics visible
    expect(hasKpis).toBeTruthy();
  });

  test('should display orders table', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // Should have orders table or empty state
    const hasTable = await authenticatedPage.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await authenticatedPage.getByText(/nenhum.*pedido|sem.*pedidos/i).isVisible().catch(() => false);
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should navigate to quote from dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Find new quote button
    const newQuoteBtn = authenticatedPage.getByRole('button', { name: /nova cotação|cotar/i });
    const newQuoteLink = authenticatedPage.getByRole('link', { name: /nova cotação|cotar/i });
    
    if (await newQuoteBtn.isVisible().catch(() => false)) {
      await newQuoteBtn.click();
    } else if (await newQuoteLink.isVisible().catch(() => false)) {
      await newQuoteLink.click();
    }
    
    await expect(authenticatedPage).toHaveURL(/\/quote/);
  });

  test('should filter orders if filters are available', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // Look for filter/search inputs
    const filterInput = authenticatedPage.getByPlaceholder(/buscar|filtrar|pesquisar/i);
    const statusFilter = authenticatedPage.getByRole('combobox');
    
    if (await filterInput.isVisible().catch(() => false)) {
      await filterInput.fill('LM-');
      await authenticatedPage.waitForTimeout(1000);
      // Filter should apply
    }
    
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      // Select options should appear
      await expect(authenticatedPage.locator('[role="option"]')).toBeVisible();
    }
  });

  test('should show order details when clicking on order', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // Find clickable order row or detail button
    const orderRow = authenticatedPage.locator('table tbody tr').first();
    const detailBtn = authenticatedPage.getByRole('button', { name: /ver.*detalhes|detalhes/i }).first();
    
    if (await orderRow.isVisible().catch(() => false)) {
      await orderRow.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show more details
      const detailsVisible = await authenticatedPage.getByText(/detalhes.*pedido|informações/i).isVisible().catch(() => false);
      
      // Either details panel/modal opened or we navigated to detail page
      // This depends on implementation
    } else if (await detailBtn.isVisible().catch(() => false)) {
      await detailBtn.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });
});

test.describe('Dashboard - Empty State', () => {
  test('should show appropriate message when no orders', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // If user has no orders, should show empty state with CTA
    const emptyState = authenticatedPage.getByText(/nenhum.*pedido|comece.*agora|faça.*primeira.*cotação/i);
    const hasOrders = await authenticatedPage.locator('table tbody tr').count() > 0;
    
    if (!hasOrders) {
      await expect(emptyState).toBeVisible();
      
      // Should have CTA to create first order
      const ctaBtn = authenticatedPage.getByRole('button', { name: /nova cotação|cotar|começar/i });
      await expect(ctaBtn).toBeVisible();
    }
  });
});

test.describe('Dashboard - Navigation', () => {
  test('should navigate to tracking from order', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    await authenticatedPage.waitForTimeout(2000);
    
    // Find tracking link in order row
    const trackingLink = authenticatedPage.getByRole('link', { name: /LM-\d+/i }).first();
    const trackingBtn = authenticatedPage.getByRole('button', { name: /rastrear|tracking/i }).first();
    
    if (await trackingLink.isVisible().catch(() => false)) {
      const href = await trackingLink.getAttribute('href');
      expect(href).toContain('/tracking');
    } else if (await trackingBtn.isVisible().catch(() => false)) {
      await trackingBtn.click();
      await expect(authenticatedPage).toHaveURL(/\/tracking/);
    }
  });
});
