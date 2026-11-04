import { test, expect } from '@playwright/test';
import { open } from '../../src/open';

// WCAG 1.4.10 Reflow: at 320 CSS px wide (= 1280 px zoomed to 400%) content must fit
// without scrolling sideways.
test.describe('Reflow at 320px', { tag: '@a11y-web' }, () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const { path, ready } of [
    { path: '/', ready: 'product-name' },
    { path: '/auth/login', ready: 'login-form' },
    { path: '/auth/register', ready: 'register-form' },
  ]) {
    test(`${path} has no horizontal scrolling`, async ({ page }) => {
      await open(page, path, ready);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});
