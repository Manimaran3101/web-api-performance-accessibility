import { test, expect } from '@playwright/test';
import { open } from '../../src/open';

// The accessibility tree is what a screen reader "sees": roles, names and structure.
// This snapshot fails if a label, heading or button name changes or disappears.
// Update after an intended change: npx playwright test aria-snapshot --update-snapshots
test.describe('Login form accessibility tree', { tag: '@a11y-web' }, () => {
  test('matches the saved ARIA snapshot', async ({ page }) => {
    await open(page, '/auth/login', 'login-form');
    const form = page.getByTestId('login-form');

    await expect(form).toMatchAriaSnapshot({ name: 'login-form.aria.yml' });
  });
});
