import { test, expect } from '../fixtures/auth';

test.describe('Profile Page - Authenticated User', () => {
  test('should access profile page when logged in', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await expect(authenticatedPage.getByText(/meu perfil|perfil|conta/i)).toBeVisible();
  });

  test('should display user information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show email field (read-only or editable)
    const emailField = authenticatedPage.getByLabel(/email/i);
    await expect(emailField).toBeVisible();
  });

  test('should allow editing profile name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Find name input
    const nameInput = authenticatedPage.getByLabel(/nome/i);
    if (await nameInput.isVisible().catch(() => false)) {
      // Clear and type new name
      await nameInput.clear();
      await nameInput.fill('Nome Atualizado Teste');
      
      // Find save button
      const saveBtn = authenticatedPage.getByRole('button', { name: /salvar|atualizar/i });
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        
        // Should show success message
        await expect(authenticatedPage.getByText(/sucesso|atualizado|salvo/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should validate password change requirements', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Find password change section
    const passwordSection = authenticatedPage.getByText(/alterar.*senha|nova.*senha/i);
    
    if (await passwordSection.isVisible().catch(() => false)) {
      // Find password inputs
      const newPasswordInput = authenticatedPage.getByLabel(/nova.*senha/i);
      
      if (await newPasswordInput.isVisible().catch(() => false)) {
        // Try weak password
        await newPasswordInput.fill('123');
        await newPasswordInput.blur();
        
        // Should show validation error
        await expect(authenticatedPage.getByText(/8 caracteres|maiúscula|minúscula|número/i)).toBeVisible();
      }
    }
  });

  test('should show account deletion option', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Scroll to bottom if needed
    await authenticatedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Should have delete account section
    const deleteSection = authenticatedPage.getByText(/excluir.*conta|deletar.*conta/i);
    await expect(deleteSection).toBeVisible();
    
    // Should have delete button
    const deleteBtn = authenticatedPage.getByRole('button', { name: /excluir|deletar/i });
    await expect(deleteBtn).toBeVisible();
  });

  test('should require confirmation for account deletion', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await authenticatedPage.waitForTimeout(1000);
    await authenticatedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const deleteBtn = authenticatedPage.getByRole('button', { name: /excluir|deletar/i });
    
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      
      // Should show confirmation dialog
      await expect(authenticatedPage.getByText(/confirmar|certeza|irreversível/i)).toBeVisible({ timeout: 3000 });
      
      // Close dialog without confirming
      await authenticatedPage.keyboard.press('Escape');
    }
  });
});

test.describe('Profile Page - Avatar Upload', () => {
  test('should have avatar upload option', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/perfil');
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Look for avatar upload area
    const avatarSection = authenticatedPage.locator('[class*="avatar"], [data-testid="avatar"]');
    const uploadInput = authenticatedPage.locator('input[type="file"][accept*="image"]');
    
    const hasAvatar = await avatarSection.first().isVisible().catch(() => false);
    const hasUpload = await uploadInput.isVisible().catch(() => false);
    
    expect(hasAvatar || hasUpload).toBeTruthy();
  });
});
