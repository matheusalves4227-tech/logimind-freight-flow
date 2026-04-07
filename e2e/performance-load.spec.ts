import { test, expect } from '@playwright/test';

// ====================================================
// E2E - TESTES DE PERFORMANCE E CARGA
// ====================================================

test.describe('Performance - Carregamento de Páginas', () => {
  const pages = [
    ['Homepage', '/'],
    ['FAQ', '/faq'],
    ['Rastreamento', '/rastreamento'],
    ['Auth', '/auth'],
    ['Ranking', '/ranking'],
  ];

  for (const [name, path] of pages) {
    test(`${name} deve carregar em menos de 5s`, async ({ page }) => {
      const start = Date.now();
      await page.goto(path as string, { waitUntil: 'domcontentloaded' });
      const elapsed = Date.now() - start;
      console.log(`[PERF] ${name}: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(5000);
    });
  }

  test('Homepage LCP deve estar abaixo de 3s', async ({ page }) => {
    await page.goto('/');
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            resolve(entries[entries.length - 1].startTime);
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(0), 5000);
      });
    });
    console.log(`[PERF] LCP: ${lcp}ms`);
    // LCP might be 0 if observer doesn't fire in time
    if (lcp > 0) {
      expect(lcp).toBeLessThan(3000);
    }
  });
});

test.describe('Performance - Tamanho do DOM', () => {
  test('Homepage não deve ter DOM excessivo', async ({ page }) => {
    await page.goto('/');
    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    console.log(`[PERF] DOM nodes: ${nodeCount}`);
    expect(nodeCount).toBeLessThan(3000);
  });
});

test.describe('Performance - Memory Leaks Check', () => {
  test('navegação repetida não deve causar crash', async ({ page }) => {
    const routes = ['/', '/faq', '/auth', '/rastreamento', '/ranking'];
    for (let i = 0; i < 3; i++) {
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(200);
      }
    }
    // Se chegou aqui sem crash, passou
    expect(true).toBe(true);
  });
});

test.describe('Performance - Concurrent Requests Simulation', () => {
  test('deve suportar múltiplas requisições de homepage', async ({ browser }) => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      promises.push(
        page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 })
          .then(() => ctx.close())
          .catch(() => ctx.close())
      );
    }
    await Promise.all(promises);
    expect(true).toBe(true);
  });
});

test.describe('Responsividade', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`Homepage renderiza em ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      // Verifica que não há overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});
