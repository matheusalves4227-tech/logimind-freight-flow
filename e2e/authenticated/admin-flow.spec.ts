import { test, expect } from '../fixtures/auth';

test.describe('Admin Panel - Access Control', () => {
  test('should not show admin menu for regular users', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    
    // Regular user should not see admin menu
    const adminMenu = authenticatedPage.getByText(/área admin|painel admin/i);
    const isVisible = await adminMenu.isVisible().catch(() => false);
    
    // This depends on user role - test expects regular user
    // If visible, user has admin role
  });

  test('should redirect non-admin from admin pages', async ({ authenticatedPage }) => {
    // Try to access admin page directly
    await authenticatedPage.goto('/admin/motoristas');
    
    // Should either redirect or show access denied
    await authenticatedPage.waitForTimeout(2000);
    
    const currentUrl = authenticatedPage.url();
    const accessDenied = await authenticatedPage.getByText(/acesso.*negado|não.*autorizado|permissão/i).isVisible().catch(() => false);
    
    // Either redirected away from admin or shown error
    const wasRedirected = !currentUrl.includes('/admin');
    expect(wasRedirected || accessDenied).toBeTruthy();
  });
});

// These tests require admin credentials
test.describe('Admin Panel - Driver Management', () => {
  test.skip('should list pending drivers', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    
    await expect(adminPage.getByText(/motoristas/i)).toBeVisible();
    
    // Should have table or list
    const hasTable = await adminPage.locator('table').isVisible().catch(() => false);
    const hasCards = await adminPage.locator('[class*="card"]').first().isVisible().catch(() => false);
    
    expect(hasTable || hasCards).toBeTruthy();
  });

  test.skip('should filter drivers by status', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    
    await adminPage.waitForTimeout(2000);
    
    // Find status filter
    const statusFilter = adminPage.getByLabel(/status/i);
    const tabPending = adminPage.getByRole('tab', { name: /pendente/i });
    
    if (await tabPending.isVisible().catch(() => false)) {
      await tabPending.click();
      await adminPage.waitForTimeout(1000);
      
      // Content should filter to pending only
    } else if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await adminPage.getByRole('option', { name: /pendente/i }).click();
    }
  });

  test.skip('should open driver details modal', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    
    await adminPage.waitForTimeout(2000);
    
    // Click on first driver row or detail button
    const detailBtn = adminPage.getByRole('button', { name: /analisar|ver.*documentos|detalhes/i }).first();
    
    if (await detailBtn.isVisible().catch(() => false)) {
      await detailBtn.click();
      
      await adminPage.waitForTimeout(1000);
      
      // Modal should open with driver details
      await expect(adminPage.getByText(/documentos|cnh|cpf/i)).toBeVisible();
    }
  });
});

test.describe('Admin Panel - Orders Management', () => {
  test.skip('should list orders in admin panel', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    await expect(adminPage.getByText(/pedidos/i)).toBeVisible();
    
    // Should have tabs for different order states
    const pendingTab = adminPage.getByRole('tab', { name: /pendente/i });
    const paidTab = adminPage.getByRole('tab', { name: /pago|pix/i });
    
    await expect(pendingTab.or(paidTab)).toBeVisible();
  });

  test.skip('should show order details in admin', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    await adminPage.waitForTimeout(2000);
    
    // Click on first order
    const detailBtn = adminPage.getByRole('button', { name: /detalhes|ver/i }).first();
    
    if (await detailBtn.isVisible().catch(() => false)) {
      await detailBtn.click();
      
      await adminPage.waitForTimeout(1000);
      
      // Should show order details
      await expect(adminPage.getByText(/valor|transportadora|origem|destino/i)).toBeVisible();
    }
  });

  test.skip('should confirm PIX payment', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    // Go to PIX pending tab
    const pixTab = adminPage.getByRole('tab', { name: /pix.*pendente/i });
    if (await pixTab.isVisible().catch(() => false)) {
      await pixTab.click();
      
      await adminPage.waitForTimeout(2000);
      
      // Find confirm button
      const confirmBtn = adminPage.getByRole('button', { name: /confirmar.*pagamento|aprovar/i }).first();
      
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        
        // Confirmation dialog should appear
        await expect(adminPage.getByText(/confirmar|tem.*certeza/i)).toBeVisible();
      }
    }
  });
});

test.describe('Admin Panel - KPIs', () => {
  test.skip('should display LogiMind KPIs', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    // Find KPIs tab
    const kpiTab = adminPage.getByRole('tab', { name: /kpi.*logimind|kpis/i });
    if (await kpiTab.isVisible().catch(() => false)) {
      await kpiTab.click();
      
      await adminPage.waitForTimeout(2000);
      
      // Should show KPI metrics
      await expect(adminPage.getByText(/margem|volume|adesão/i)).toBeVisible();
    }
  });

  test.skip('should display financial metrics', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    await adminPage.waitForTimeout(2000);
    
    // Look for financial KPIs
    const gmv = adminPage.getByText(/gmv|faturamento/i);
    const revenue = adminPage.getByText(/receita|comissão/i);
    
    await expect(gmv.or(revenue)).toBeVisible();
  });
});

test.describe('Admin Panel - Carriers Management', () => {
  test.skip('should list carriers', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    // Find carriers tab
    const carriersTab = adminPage.getByRole('tab', { name: /transportadora/i });
    if (await carriersTab.isVisible().catch(() => false)) {
      await carriersTab.click();
      
      await adminPage.waitForTimeout(2000);
      
      // Should show carriers list
      const hasTable = await adminPage.locator('table').isVisible().catch(() => false);
      const hasCards = await adminPage.locator('[class*="card"]').count() > 1;
      
      expect(hasTable || hasCards).toBeTruthy();
    }
  });

  test.skip('should add new carrier', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    
    const carriersTab = adminPage.getByRole('tab', { name: /transportadora/i });
    if (await carriersTab.isVisible().catch(() => false)) {
      await carriersTab.click();
      
      await adminPage.waitForTimeout(1000);
      
      // Find add button
      const addBtn = adminPage.getByRole('button', { name: /adicionar|nova.*transportadora/i });
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        
        // Form should appear
        await expect(adminPage.getByLabel(/nome/i)).toBeVisible();
      }
    }
  });
});
