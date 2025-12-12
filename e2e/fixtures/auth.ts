import { test as base, expect, Page } from '@playwright/test';

// Test user credentials - use environment variables or test accounts
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'teste.e2e@logimarket.com.br',
  password: process.env.TEST_USER_PASSWORD || 'TestE2E@2024',
  name: 'Teste E2E LogiMarket',
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin.e2e@logimarket.com.br',
  password: process.env.TEST_ADMIN_PASSWORD || 'AdminE2E@2024',
  name: 'Admin E2E LogiMarket',
};

// Extend base test with authentication fixtures
export type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  testUser: typeof TEST_USER;
  testAdmin: typeof TEST_ADMIN;
};

async function loginUser(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/senha/i).fill(password);
    
    // Click login button
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Wait for navigation or error
    await Promise.race([
      page.waitForURL(/\/dashboard|\/$/),
      page.waitForSelector('[data-sonner-toast][data-type="error"]', { timeout: 5000 }).catch(() => null),
    ]);
    
    // Check if login was successful
    const currentUrl = page.url();
    return currentUrl.includes('/dashboard') || currentUrl.endsWith('/');
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

async function signupUser(page: Page, email: string, password: string, name: string): Promise<boolean> {
  try {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Switch to signup tab
    await page.getByRole('tab', { name: /cadastrar/i }).click();
    
    // Fill signup form
    await page.getByLabel(/nome completo/i).fill(name);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/senha/i).fill(password);
    
    // Click signup button
    await page.getByRole('button', { name: /criar conta/i }).click();
    
    // Wait for success or error
    await Promise.race([
      page.waitForURL(/\/dashboard|\/$/),
      page.waitForSelector('[data-sonner-toast]', { timeout: 10000 }).catch(() => null),
    ]);
    
    const currentUrl = page.url();
    return currentUrl.includes('/dashboard') || currentUrl.endsWith('/');
  } catch (error) {
    console.error('Signup failed:', error);
    return false;
  }
}

export const test = base.extend<AuthFixtures>({
  testUser: TEST_USER,
  testAdmin: TEST_ADMIN,
  
  authenticatedPage: async ({ page }, use) => {
    // Try to login, if fails try to signup
    let loggedIn = await loginUser(page, TEST_USER.email, TEST_USER.password);
    
    if (!loggedIn) {
      // User might not exist, try to sign up
      loggedIn = await signupUser(page, TEST_USER.email, TEST_USER.password, TEST_USER.name);
    }
    
    if (!loggedIn) {
      throw new Error('Failed to authenticate test user');
    }
    
    await use(page);
    
    // Cleanup: sign out after test
    try {
      await page.goto('/');
      // Try to find and click logout if visible
      const logoutBtn = page.getByText(/sair/i);
      if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutBtn.click();
      }
    } catch {
      // Ignore cleanup errors
    }
  },
  
  adminPage: async ({ page }, use) => {
    // Try to login as admin
    const loggedIn = await loginUser(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    if (!loggedIn) {
      console.warn('Admin login failed - skipping admin test');
      throw new Error('Admin authentication required for this test');
    }
    
    await use(page);
    
    // Cleanup
    try {
      await page.goto('/');
      const logoutBtn = page.getByText(/sair/i);
      if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutBtn.click();
      }
    } catch {
      // Ignore cleanup errors
    }
  },
});

export { expect };
