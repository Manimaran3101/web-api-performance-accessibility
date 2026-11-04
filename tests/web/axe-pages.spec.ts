import { test, expect } from '@playwright/test';
import { newSeriousViolations } from '../../src/axe';
import { API_URL } from '../../src/env';
import { open } from '../../src/open';

// Each page is scanned once it has really loaded (its key element is visible).
const pages = [
  { name: 'home', path: '/', ready: 'product-name' },
  { name: 'login', path: '/auth/login', ready: 'login-form' },
  { name: 'register', path: '/auth/register', ready: 'register-form' },
  { name: 'contact', path: '/contact', ready: 'contact-submit' },
];

test.describe('axe scan (WCAG 2.2 AA)', { tag: '@a11y-web' }, () => {
  for (const { name, path, ready } of pages) {
    test(`${name} page has no new serious violations`, async ({ page }, testInfo) => {
      await open(page, path, ready);

      expect(await newSeriousViolations(page, name, testInfo)).toEqual([]);
    });
  }

  test('product page has no new serious violations', async ({ page, request }, testInfo) => {
    const res = await request.get(`${API_URL}/products?page=1`);
    const productId: string = (await res.json()).data[0].id;

    await open(page, `/product/${productId}`, 'add-to-cart');

    expect(await newSeriousViolations(page, 'product', testInfo)).toEqual([]);
  });

  // Error messages are where forms often fail screen-reader users.
  test('login page with errors shown has no new serious violations', async ({ page }, testInfo) => {
    await open(page, '/auth/login', 'login-form');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('email-error')).toBeVisible();

    expect(await newSeriousViolations(page, 'login-errors', testInfo)).toEqual([]);
  });
});
