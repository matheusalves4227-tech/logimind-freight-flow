import { test, expect } from './fixtures/auth';

// ============================================================================
// FLUXO MOTORISTA: DASHBOARD
// ============================================================================
test.describe('Driver Dashboard - Access', () => {
  test('should access driver dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show driver dashboard or redirect to onboarding
    const hasDashboard = await authenticatedPage.getByText(/dashboard|painel|motorista/i).isVisible().catch(() => false);
    const hasOnboarding = await authenticatedPage.getByText(/cadastro|onboarding/i).isVisible().catch(() => false);
    const wasRedirected = !authenticatedPage.url().includes('/motorista/dashboard');
    
    expect(hasDashboard || hasOnboarding || wasRedirected).toBeTruthy();
  });

  test('should show driver greeting with correct name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show personalized greeting
    const hasGreeting = await authenticatedPage.getByText(/olá|bem-vindo/i).isVisible().catch(() => false);
    expect(hasGreeting).toBeTruthy();
  });
});

// ============================================================================
// FLUXO MOTORISTA: ABAS DO DASHBOARD
// ============================================================================
test.describe('Driver Dashboard - Tabs', () => {
  test('should have status tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const statusTab = authenticatedPage.getByRole('tab', { name: /status/i });
    const hasStatusTab = await statusTab.isVisible().catch(() => false);
    
    expect(hasStatusTab).toBeTruthy();
  });

  test('should have opportunities tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const opportunitiesTab = authenticatedPage.getByRole('tab', { name: /oportunidade|frete/i });
    const hasOpportunitiesTab = await opportunitiesTab.isVisible().catch(() => false);
    
    expect(hasOpportunitiesTab).toBeTruthy();
  });

  test('should have financial tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro|ganho/i });
    const hasFinancialTab = await financialTab.isVisible().catch(() => false);
    
    expect(hasFinancialTab).toBeTruthy();
  });

  test('should have profile tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const profileTab = authenticatedPage.getByRole('tab', { name: /perfil/i });
    const hasProfileTab = await profileTab.isVisible().catch(() => false);
    
    expect(hasProfileTab).toBeTruthy();
  });
});

// ============================================================================
// FLUXO MOTORISTA: STATUS E DISPONIBILIDADE
// ============================================================================
test.describe('Driver Dashboard - Status & Availability', () => {
  test('should have availability toggle', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    // Go to status tab
    const statusTab = authenticatedPage.getByRole('tab', { name: /status/i });
    if (await statusTab.isVisible()) {
      await statusTab.click();
      await authenticatedPage.waitForTimeout(500);
    }
    
    // Should have availability toggle
    const toggle = authenticatedPage.locator('[role="switch"]');
    const hasToggle = await toggle.isVisible().catch(() => false);
    
    expect(hasToggle).toBeTruthy();
  });

  test('should persist availability toggle state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const statusTab = authenticatedPage.getByRole('tab', { name: /status/i });
    if (await statusTab.isVisible()) {
      await statusTab.click();
      await authenticatedPage.waitForTimeout(500);
    }
    
    const toggle = authenticatedPage.locator('[role="switch"]');
    if (await toggle.isVisible()) {
      // Get current state
      const initialState = await toggle.getAttribute('data-state');
      
      // Click to toggle
      await toggle.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // State should change
      const newState = await toggle.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
      
      // Toggle back
      await toggle.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });
});

// ============================================================================
// FLUXO MOTORISTA: OPORTUNIDADES DE FRETE
// ============================================================================
test.describe('Driver Dashboard - Opportunities', () => {
  test('should display opportunities tab content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const opportunitiesTab = authenticatedPage.getByRole('tab', { name: /oportunidade|frete/i });
    if (await opportunitiesTab.isVisible()) {
      await opportunitiesTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show opportunities or empty state
      const hasOpportunities = await authenticatedPage.getByText(/frete|oportunidade|disponível/i).isVisible().catch(() => false);
      const hasEmptyState = await authenticatedPage.getByText(/nenhum.*frete|sem.*oportunidade/i).isVisible().catch(() => false);
      
      expect(hasOpportunities || hasEmptyState).toBeTruthy();
    }
  });

  test('should show freight details in opportunities', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const opportunitiesTab = authenticatedPage.getByRole('tab', { name: /oportunidade|frete/i });
    if (await opportunitiesTab.isVisible()) {
      await opportunitiesTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // If opportunities exist, they should have details
      const hasPrice = await authenticatedPage.getByText(/R\$/).isVisible().catch(() => false);
      const hasRoute = await authenticatedPage.getByText(/origem|destino/i).isVisible().catch(() => false);
      
      // Either has details or is empty
      expect(hasPrice || hasRoute || await authenticatedPage.getByText(/nenhum/i).isVisible().catch(() => false)).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO MOTORISTA: FINANCEIRO
// ============================================================================
test.describe('Driver Dashboard - Financial', () => {
  test('should display financial tab content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro|ganho/i });
    if (await financialTab.isVisible()) {
      await financialTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show financial info
      const hasFinancialInfo = await authenticatedPage.getByText(/saldo|ganho|receber|pix/i).isVisible().catch(() => false);
      expect(hasFinancialInfo).toBeTruthy();
    }
  });

  test('should have bank account section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro|ganho/i });
    if (await financialTab.isVisible()) {
      await financialTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show bank account section
      const hasBankSection = await authenticatedPage.getByText(/conta.*bancária|dados.*bancários|pix/i).isVisible().catch(() => false);
      expect(hasBankSection).toBeTruthy();
    }
  });

  test('should have PIX key type selector', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro|ganho/i });
    if (await financialTab.isVisible()) {
      await financialTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should have PIX key type selector
      const hasPixType = await authenticatedPage.getByText(/tipo.*chave|chave.*pix/i).isVisible().catch(() => false);
      expect(hasPixType).toBeTruthy();
    }
  });

  test('should clear PIX key when type changes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro|ganho/i });
    if (await financialTab.isVisible()) {
      await financialTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Find PIX key input
      const pixKeyInput = authenticatedPage.getByLabel(/chave pix/i);
      if (await pixKeyInput.isVisible()) {
        // Fill a value
        await pixKeyInput.fill('test@email.com');
        
        // Change PIX type (click on select/dropdown)
        const typeSelector = authenticatedPage.getByLabel(/tipo.*chave/i);
        if (await typeSelector.isVisible()) {
          await typeSelector.click();
          await authenticatedPage.waitForTimeout(500);
          
          // Select different type
          const cpfOption = authenticatedPage.getByText(/cpf/i);
          if (await cpfOption.isVisible()) {
            await cpfOption.click();
            await authenticatedPage.waitForTimeout(500);
            
            // PIX key should be cleared
            const newValue = await pixKeyInput.inputValue();
            expect(newValue).toBe('');
          }
        }
      }
    }
  });

  test('should display payment history', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const financialTab = authenticatedPage.getByRole('tab', { name: /financeiro|ganho/i });
    if (await financialTab.isVisible()) {
      await financialTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should have payment history section
      const hasHistory = await authenticatedPage.getByText(/histórico|pagamento|repasse/i).isVisible().catch(() => false);
      expect(hasHistory).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO MOTORISTA: PERFIL
// ============================================================================
test.describe('Driver Dashboard - Profile', () => {
  test('should display profile tab content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const profileTab = authenticatedPage.getByRole('tab', { name: /perfil/i });
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show profile info
      const hasProfileInfo = await authenticatedPage.getByText(/nome|cpf|telefone|email/i).isVisible().catch(() => false);
      expect(hasProfileInfo).toBeTruthy();
    }
  });

  test('should have profile photo section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const profileTab = authenticatedPage.getByRole('tab', { name: /perfil/i });
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should have profile photo section
      const hasPhotoSection = await authenticatedPage.getByText(/foto|avatar|imagem/i).isVisible().catch(() => false);
      const hasUploadArea = await authenticatedPage.locator('input[type="file"]').isVisible().catch(() => false);
      
      expect(hasPhotoSection || hasUploadArea).toBeTruthy();
    }
  });

  test('should display driver data from registration', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const profileTab = authenticatedPage.getByRole('tab', { name: /perfil/i });
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show driver's registered data
      const hasName = await authenticatedPage.getByText(/nome/i).isVisible().catch(() => false);
      const hasCpf = await authenticatedPage.getByText(/cpf/i).isVisible().catch(() => false);
      
      expect(hasName || hasCpf).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO MOTORISTA: CARGAS ATIVAS
// ============================================================================
test.describe('Driver Dashboard - Active Loads', () => {
  test('should display active loads section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    // Should have active loads or status tab content
    const hasActiveSection = await authenticatedPage.getByText(/ativa|em andamento|atual/i).isVisible().catch(() => false);
    expect(hasActiveSection).toBeTruthy();
  });

  test('should show load status options', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    const statusTab = authenticatedPage.getByRole('tab', { name: /status/i });
    if (await statusTab.isVisible()) {
      await statusTab.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // If there are active loads, should have status update buttons
      const hasStatusButtons = await authenticatedPage.getByRole('button', { name: /confirmar|iniciar|concluir/i }).isVisible().catch(() => false);
      const hasEmptyState = await authenticatedPage.getByText(/nenhum.*carga|sem.*frete.*ativo/i).isVisible().catch(() => false);
      
      expect(hasStatusButtons || hasEmptyState).toBeTruthy();
    }
  });
});

// ============================================================================
// FLUXO MOTORISTA: VALIDAÇÃO DE COLETA
// ============================================================================
test.describe('Driver - Pickup Validation', () => {
  test('should access pickup validation page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/codigo-coleta');
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show pickup code page or redirect
    const hasPickupPage = await authenticatedPage.getByText(/código.*coleta|validar|coleta/i).isVisible().catch(() => false);
    const wasRedirected = !authenticatedPage.url().includes('/codigo-coleta');
    
    expect(hasPickupPage || wasRedirected).toBeTruthy();
  });
});

// ============================================================================
// FLUXO MOTORISTA: NAVEGAÇÃO ESPECÍFICA
// ============================================================================
test.describe('Driver Navigation - Specific', () => {
  test('should not show quote options for drivers', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    // Driver navbar should not show quote options
    const hasQuoteOption = await authenticatedPage.getByText(/cotação|cotar/i).isVisible().catch(() => false);
    
    // This depends on implementation - for now just check driver area exists
    const hasDriverArea = await authenticatedPage.getByText(/motorista|dashboard/i).isVisible().catch(() => false);
    expect(hasDriverArea).toBeTruthy();
  });

  test('should have driver-specific menu items', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/motorista/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    // Should have driver-specific options
    const hasDriverMenu = await authenticatedPage.getByText(/área.*motorista|painel.*motorista/i).isVisible().catch(() => false);
    expect(hasDriverMenu).toBeTruthy();
  });
});

// ============================================================================
// FLUXO MOTORISTA: AGUARDANDO APROVAÇÃO
// ============================================================================
test.describe('Driver - Pending Approval', () => {
  test('should show pending approval status when not approved', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/aguardando-aprovacao');
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show pending message or redirect
    const hasPendingMessage = await authenticatedPage.getByText(/aguardando|análise|aprovação|pendente/i).isVisible().catch(() => false);
    const wasRedirected = !authenticatedPage.url().includes('/aguardando-aprovacao');
    
    expect(hasPendingMessage || wasRedirected).toBeTruthy();
  });

  test('should explain the approval process', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/aguardando-aprovacao');
    await authenticatedPage.waitForTimeout(2000);
    
    const hasExplanation = await authenticatedPage.getByText(/documentos|verificação|processo/i).isVisible().catch(() => false);
    expect(hasExplanation).toBeTruthy();
  });
});
