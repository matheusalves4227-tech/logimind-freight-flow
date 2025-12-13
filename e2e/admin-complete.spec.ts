import { test, expect } from './fixtures/auth';

// ============================================================================
// FLUXO ADMIN: ACESSO E NAVEGAÇÃO
// ============================================================================
test.describe('Admin Panel - Access Control', () => {
  test('should have admin navigation when admin role', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Should be on admin page
    const isAdminRoute = adminPage.url().includes('/admin');
    expect(isAdminRoute).toBeTruthy();
  });

  test('should display admin tabs', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Should have admin tabs
    const hasTabs = await adminPage.locator('[role="tablist"]').isVisible().catch(() => false);
    expect(hasTabs).toBeTruthy();
  });
});

// ============================================================================
// FLUXO ADMIN: GESTÃO DE PEDIDOS
// ============================================================================
test.describe('Admin Panel - Orders Management', () => {
  test('should display orders table', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Should show orders table or empty state
    const hasTable = await adminPage.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await adminPage.getByText(/nenhum.*pedido|sem.*pedidos/i).isVisible().catch(() => false);
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should have order status tabs', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Should have status filter tabs
    const hasPending = await adminPage.getByText(/pendente/i).isVisible().catch(() => false);
    const hasAccepted = await adminPage.getByText(/aceito|aprovado/i).isVisible().catch(() => false);
    
    expect(hasPending || hasAccepted).toBeTruthy();
  });

  test('should be able to view order details', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Click on view details button if orders exist
    const detailsBtn = adminPage.getByRole('button', { name: /detalhes|ver|visualizar/i }).first();
    if (await detailsBtn.isVisible().catch(() => false)) {
      await detailsBtn.click();
      await adminPage.waitForTimeout(1000);
      
      // Should show order details modal or page
      const hasDetails = await adminPage.getByText(/código.*pedido|tracking|detalhes/i).isVisible().catch(() => false);
      expect(hasDetails).toBeTruthy();
    }
  });

  test('should have PIX pending tab', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Should have PIX pending tab for payment confirmation
    const pixTab = adminPage.getByRole('tab', { name: /pix|pagamento/i });
    const hasPixTab = await pixTab.isVisible().catch(() => false);
    
    expect(hasPixTab).toBeTruthy();
  });
});

// ============================================================================
// FLUXO ADMIN: GESTÃO DE MOTORISTAS
// ============================================================================
test.describe('Admin Panel - Driver Management', () => {
  test('should access drivers page', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    await adminPage.waitForTimeout(2000);
    
    // Should show drivers management
    const hasDriversContent = await adminPage.getByText(/motorista|driver/i).isVisible().catch(() => false);
    expect(hasDriversContent).toBeTruthy();
  });

  test('should have status filters for drivers', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    await adminPage.waitForTimeout(2000);
    
    // Should have filter options
    const hasPending = await adminPage.getByText(/pendente/i).isVisible().catch(() => false);
    const hasApproved = await adminPage.getByText(/aprovado/i).isVisible().catch(() => false);
    const hasRejected = await adminPage.getByText(/rejeitado/i).isVisible().catch(() => false);
    
    expect(hasPending || hasApproved || hasRejected).toBeTruthy();
  });

  test('should display drivers table or empty state', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    await adminPage.waitForTimeout(2000);
    
    const hasTable = await adminPage.locator('table').isVisible().catch(() => false);
    const hasCards = await adminPage.locator('[class*="card"]').first().isVisible().catch(() => false);
    const hasEmptyState = await adminPage.getByText(/nenhum.*motorista/i).isVisible().catch(() => false);
    
    expect(hasTable || hasCards || hasEmptyState).toBeTruthy();
  });

  test('should be able to view driver documents', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    await adminPage.waitForTimeout(2000);
    
    // Click on analyze/view documents if available
    const analyzeBtn = adminPage.getByRole('button', { name: /analisar|documentos|ver/i }).first();
    if (await analyzeBtn.isVisible().catch(() => false)) {
      await analyzeBtn.click();
      await adminPage.waitForTimeout(1000);
      
      // Should show document viewer or details
      const hasDocuments = await adminPage.getByText(/documento|cnh|crlv/i).isVisible().catch(() => false);
      expect(hasDocuments).toBeTruthy();
    }
  });

  test('should have approve/reject actions for pending drivers', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    await adminPage.waitForTimeout(2000);
    
    // Filter to pending if possible
    const pendingTab = adminPage.getByRole('tab', { name: /pendente/i });
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await adminPage.waitForTimeout(1000);
    }
    
    // Check for approve/reject buttons
    const approveBtn = adminPage.getByRole('button', { name: /aprovar/i }).first();
    const rejectBtn = adminPage.getByRole('button', { name: /rejeitar/i }).first();
    
    const hasApprove = await approveBtn.isVisible().catch(() => false);
    const hasReject = await rejectBtn.isVisible().catch(() => false);
    
    // If there are pending drivers, actions should be available
    expect(hasApprove || hasReject || await adminPage.getByText(/nenhum.*pendente/i).isVisible().catch(() => false)).toBeTruthy();
  });

  test('should require reason for rejection', async ({ adminPage }) => {
    await adminPage.goto('/admin/motoristas');
    await adminPage.waitForTimeout(2000);
    
    // Try to reject without reason
    const rejectBtn = adminPage.getByRole('button', { name: /rejeitar/i }).first();
    if (await rejectBtn.isVisible().catch(() => false)) {
      await rejectBtn.click();
      await adminPage.waitForTimeout(500);
      
      // Should show reason input or modal
      const hasReasonInput = await adminPage.getByLabel(/motivo|razão|justificativa/i).isVisible().catch(() => false);
      const hasReasonText = await adminPage.getByPlaceholder(/motivo|razão/i).isVisible().catch(() => false);
      
      expect(hasReasonInput || hasReasonText).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO ADMIN: GESTÃO DE TRANSPORTADORAS
// ============================================================================
test.describe('Admin Panel - Carriers Management', () => {
  test('should access carriers page', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(1000);
    
    // Navigate to carriers tab
    const carriersTab = adminPage.getByRole('tab', { name: /transportadora/i });
    if (await carriersTab.isVisible().catch(() => false)) {
      await carriersTab.click();
      await adminPage.waitForTimeout(1000);
      
      const hasCarriersContent = await adminPage.getByText(/transportadora/i).isVisible().catch(() => false);
      expect(hasCarriersContent).toBeTruthy();
    }
  });

  test('should be able to add new carrier', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(1000);
    
    const carriersTab = adminPage.getByRole('tab', { name: /transportadora/i });
    if (await carriersTab.isVisible().catch(() => false)) {
      await carriersTab.click();
      await adminPage.waitForTimeout(1000);
      
      const addBtn = adminPage.getByRole('button', { name: /adicionar|nova|cadastrar/i });
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await adminPage.waitForTimeout(500);
        
        // Should show form
        const hasForm = await adminPage.getByLabel(/nome/i).isVisible().catch(() => false);
        expect(hasForm).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// FLUXO ADMIN: KPIs E MÉTRICAS
// ============================================================================
test.describe('Admin Panel - KPIs & Metrics', () => {
  test('should display financial KPIs', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Navigate to KPIs tab
    const kpisTab = adminPage.getByRole('tab', { name: /kpi|métrica|financeiro/i });
    if (await kpisTab.isVisible().catch(() => false)) {
      await kpisTab.click();
      await adminPage.waitForTimeout(1000);
      
      // Should show KPI cards
      const hasKPIs = await adminPage.getByText(/gmv|faturamento|receita|comissão/i).isVisible().catch(() => false);
      expect(hasKPIs).toBeTruthy();
    }
  });

  test('should display LogiMind KPIs', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Navigate to LogiMind KPIs tab
    const logimindTab = adminPage.getByRole('tab', { name: /logimind/i });
    if (await logimindTab.isVisible().catch(() => false)) {
      await logimindTab.click();
      await adminPage.waitForTimeout(1000);
      
      // Should show LogiMind metrics
      const hasLogimind = await adminPage.getByText(/logimind|margem|rota|demanda/i).isVisible().catch(() => false);
      expect(hasLogimind).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO ADMIN: LOGS DE AUDITORIA
// ============================================================================
test.describe('Admin Panel - Audit Logs', () => {
  test('should access audit logs page', async ({ adminPage }) => {
    await adminPage.goto('/admin/auditoria');
    await adminPage.waitForTimeout(2000);
    
    // Should show audit logs
    const hasAuditContent = await adminPage.getByText(/auditoria|log|registro/i).isVisible().catch(() => false);
    expect(hasAuditContent).toBeTruthy();
  });

  test('should display audit logs table', async ({ adminPage }) => {
    await adminPage.goto('/admin/auditoria');
    await adminPage.waitForTimeout(2000);
    
    // Should show logs table or empty state
    const hasTable = await adminPage.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await adminPage.getByText(/nenhum.*log|sem.*registro/i).isVisible().catch(() => false);
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should have filters for audit logs', async ({ adminPage }) => {
    await adminPage.goto('/admin/auditoria');
    await adminPage.waitForTimeout(2000);
    
    // Should have filter inputs
    const hasUserIdFilter = await adminPage.getByPlaceholder(/usuário|user.*id/i).isVisible().catch(() => false);
    const hasActionFilter = await adminPage.getByPlaceholder(/ação|action/i).isVisible().catch(() => false);
    const hasFilters = await adminPage.getByText(/filtro|buscar/i).isVisible().catch(() => false);
    
    expect(hasUserIdFilter || hasActionFilter || hasFilters).toBeTruthy();
  });

  test('should be able to view log details', async ({ adminPage }) => {
    await adminPage.goto('/admin/auditoria');
    await adminPage.waitForTimeout(2000);
    
    // Click on details button if logs exist
    const detailsBtn = adminPage.getByRole('button', { name: /detalhes|json|ver/i }).first();
    if (await detailsBtn.isVisible().catch(() => false)) {
      await detailsBtn.click();
      await adminPage.waitForTimeout(500);
      
      // Should show details modal
      const hasDetails = await adminPage.getByText(/metadata|payload|detalhes/i).isVisible().catch(() => false);
      expect(hasDetails).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO ADMIN: DOCUMENTOS
// ============================================================================
test.describe('Admin Panel - Documents Management', () => {
  test('should access documents page', async ({ adminPage }) => {
    await adminPage.goto('/admin/documentos');
    await adminPage.waitForTimeout(2000);
    
    // Should show documents management
    const hasDocumentsContent = await adminPage.getByText(/documento|verificação/i).isVisible().catch(() => false);
    expect(hasDocumentsContent).toBeTruthy();
  });

  test('should display documents list or empty state', async ({ adminPage }) => {
    await adminPage.goto('/admin/documentos');
    await adminPage.waitForTimeout(2000);
    
    const hasList = await adminPage.locator('table, [class*="card"]').first().isVisible().catch(() => false);
    const hasEmptyState = await adminPage.getByText(/nenhum.*documento/i).isVisible().catch(() => false);
    
    expect(hasList || hasEmptyState).toBeTruthy();
  });
});

// ============================================================================
// FLUXO ADMIN: REPASSE PENDENTE
// ============================================================================
test.describe('Admin Panel - Pending Payouts', () => {
  test('should display pending payouts section', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    // Navigate to pending payouts tab
    const payoutsTab = adminPage.getByRole('tab', { name: /repasse|payout/i });
    if (await payoutsTab.isVisible().catch(() => false)) {
      await payoutsTab.click();
      await adminPage.waitForTimeout(1000);
      
      const hasPayoutsContent = await adminPage.getByText(/repasse|motorista|pagamento/i).isVisible().catch(() => false);
      expect(hasPayoutsContent).toBeTruthy();
    }
  });

  test('should show payout details', async ({ adminPage }) => {
    await adminPage.goto('/admin/pedidos');
    await adminPage.waitForTimeout(2000);
    
    const payoutsTab = adminPage.getByRole('tab', { name: /repasse|payout/i });
    if (await payoutsTab.isVisible().catch(() => false)) {
      await payoutsTab.click();
      await adminPage.waitForTimeout(1000);
      
      // Should show payout information
      const hasPayoutInfo = await adminPage.getByText(/valor|motorista|data/i).isVisible().catch(() => false);
      expect(hasPayoutInfo).toBeTruthy();
    }
  });
});
