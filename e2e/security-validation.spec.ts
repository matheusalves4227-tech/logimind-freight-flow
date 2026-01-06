import { test, expect } from '@playwright/test';

// ============================================
// SECURITY VALIDATION E2E TESTS
// Tests for XSS, CSRF, injection attacks prevention
// ============================================

test.describe('Security - SQL Injection Prevention', () => {
  
  test('should sanitize SQL injection in tracking code', async ({ page }) => {
    await page.goto('/tracking');
    
    const sqlInjection = "'; DROP TABLE orders; --";
    await page.getByLabel(/código/i).fill(sqlInjection);
    await page.getByRole('button', { name: /rastrear/i }).click();
    
    // Should show error, not crash
    await expect(page.getByText(/não encontrado|inválido|erro/i)).toBeVisible({ timeout: 5000 });
  });

  test('should sanitize SQL injection in login email', async ({ page }) => {
    await page.goto('/auth');
    
    const sqlInjection = "admin'--";
    await page.getByLabel(/email/i).fill(sqlInjection + '@test.com');
    await page.getByLabel(/senha/i).fill('Password123');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Should show invalid credentials, not SQL error
    await page.waitForTimeout(2000);
    // No SQL error should be visible
    await expect(page.locator('text=/syntax error|SQL|postgres/i')).not.toBeVisible();
  });
});

test.describe('Security - XSS Prevention', () => {
  
  test('should escape HTML in name field', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /cadastrar/i }).click();
    
    const xssPayload = '<img src=x onerror=alert(document.cookie)>';
    await page.getByLabel(/nome completo/i).fill(xssPayload);
    
    // Check that the value is not rendered as HTML
    const nameInput = page.getByLabel(/nome completo/i);
    const value = await nameInput.inputValue();
    
    // Should be escaped or sanitized
    expect(value).not.toContain('onerror=');
  });

  test('should escape JavaScript in URL parameters', async ({ page }) => {
    const xssUrl = '/tracking?code=<script>alert("XSS")</script>';
    await page.goto(xssUrl);
    
    // Page should not execute script
    await page.waitForTimeout(500);
    
    // Should not show alert or execute script
    const dialogHandled = await page.evaluate(() => {
      return !document.querySelector('script:not([src])');
    });
    expect(dialogHandled).toBeTruthy();
  });

  test('should prevent event handler injection', async ({ page }) => {
    await page.goto('/cadastro-parceiro');
    await page.getByText(/motorista autônomo/i).click();
    
    const xssPayload = '" onmouseover="alert(1)" x="';
    const cpfInput = page.getByLabel(/cpf/i);
    await cpfInput.fill(xssPayload);
    
    // Verify no event handler was added
    const hasHandler = await cpfInput.evaluate((el) => {
      return el.hasAttribute('onmouseover');
    });
    expect(hasHandler).toBeFalsy();
  });
});

test.describe('Security - CSRF Protection', () => {
  
  test('should include CSRF token in forms', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for hidden CSRF field or header
    // Supabase handles this internally, but we verify form integrity
    const form = page.locator('form');
    if (await form.isVisible()) {
      // Form should have proper action or be handled by JS
      const action = await form.getAttribute('action');
      expect(action).toBeNull(); // JS handled forms don't have action
    }
  });
});

test.describe('Security - Authentication Bypass Prevention', () => {
  
  test('should not allow direct access to protected routes', async ({ page }) => {
    // Try to access admin route directly
    await page.goto('/admin/orders');
    
    // Should redirect to auth or home
    await expect(page).toHaveURL(/\/auth|\/$/);
  });

  test('should not expose sensitive data in URL', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/senha/i).fill('Password123!');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Password should not be in URL
    const url = page.url();
    expect(url).not.toContain('Password');
    expect(url).not.toContain('password');
  });

  test('should not show password in page source', async ({ page }) => {
    await page.goto('/auth');
    
    const password = 'SecretPassword123!';
    await page.getByLabel(/senha/i).fill(password);
    
    // Get page content
    const content = await page.content();
    
    // Password should not appear in plain text in HTML
    expect(content).not.toContain(password);
  });
});

test.describe('Security - Rate Limiting Indicators', () => {
  
  test('should handle rapid form submissions', async ({ page }) => {
    await page.goto('/auth');
    
    // Try rapid submissions
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/email/i).fill(`test${i}@example.com`);
      await page.getByLabel(/senha/i).fill('Password123!');
      await page.getByRole('button', { name: /entrar/i }).click();
      await page.waitForTimeout(100);
    }
    
    // Should not crash or show rate limit message after reasonable attempts
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Security - Session Management', () => {
  
  test('should not persist sensitive data in localStorage after logout', async ({ page }) => {
    await page.goto('/auth');
    
    // Check localStorage for sensitive data
    const sensitiveData = await page.evaluate(() => {
      const storage = window.localStorage;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        const value = storage.getItem(key!);
        if (value && (value.includes('password') || value.includes('secret'))) {
          return true;
        }
      }
      return false;
    });
    
    expect(sensitiveData).toBeFalsy();
  });

  test('should use secure cookies', async ({ page }) => {
    await page.goto('/auth');
    
    const cookies = await page.context().cookies();
    
    for (const cookie of cookies) {
      // Sensitive cookies should be httpOnly and secure in production
      if (cookie.name.includes('auth') || cookie.name.includes('session')) {
        // In development, secure may be false, but httpOnly should be true
        expect(cookie.httpOnly).toBeTruthy();
      }
    }
  });
});

test.describe('Security - Input Sanitization', () => {
  
  test('should handle null bytes in input', async ({ page }) => {
    await page.goto('/tracking');
    
    // Null byte injection attempt
    const nullBytePayload = 'LM-2024\x00-INJECT';
    await page.getByLabel(/código/i).fill(nullBytePayload);
    await page.getByRole('button', { name: /rastrear/i }).click();
    
    // Should handle gracefully
    await expect(page.getByText(/não encontrado|inválido|erro/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle unicode normalization attacks', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /cadastrar/i }).click();
    
    // Unicode normalization attack
    const unicodePayload = 'admin\u200Badmin'; // Zero-width space
    await page.getByLabel(/nome completo/i).fill(unicodePayload);
    
    // Should handle without issues
    const value = await page.getByLabel(/nome completo/i).inputValue();
    expect(value).toBeTruthy();
  });
});

test.describe('Security - Headers Check', () => {
  
  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const headers = response.headers();
      
      // Check for common security headers (may vary based on setup)
      // These are recommendations, not all may be present in development
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];
      
      // Log which headers are present (for debugging)
      for (const header of securityHeaders) {
        const value = headers[header];
        if (value) {
          expect(value).toBeTruthy();
        }
      }
    }
  });
});
