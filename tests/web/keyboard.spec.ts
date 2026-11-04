import { test, expect, type Locator } from '@playwright/test';
import { open } from '../../src/open';

// People who can't use a mouse (and many screen-reader users) move with Tab and Enter.
test.describe('Keyboard use of the login form', { tag: '@a11y-web' }, () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/auth/login', 'login-form');
  });

  test('Tab moves through the form in a logical order', async ({ page }) => {
    await page.getByTestId('email').focus();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('password')).toBeFocused();
    await page.keyboard.press('Tab'); // the show-password button
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('login-submit')).toBeFocused();
  });

  test('the form can be sent with Enter, and errors are linked to their fields', async ({
    page,
  }) => {
    await page.getByTestId('email').focus();
    await page.keyboard.press('Enter');

    // WCAG 3.3.1: the error is shown and screen readers announce it with the field.
    const email = page.getByTestId('email');
    await expect(page.getByTestId('email-error')).toBeVisible();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-describedby', 'email-error');
  });

  test('the focused field shows a visible focus indicator', async ({ page }) => {
    // WCAG 2.4.7: you must be able to see where the keyboard focus is.
    await page.getByTestId('email').focus();
    await page.keyboard.press('Tab');
    const password = page.getByTestId('password');
    await expect(password).toBeFocused();

    await expect.poll(() => focusIndicator(password)).not.toBe('none');
  });

  test('the email field says what it is for (autocomplete)', async ({ page }) => {
    test.info().annotations.push({
      type: 'known issue',
      description: 'WCAG 1.3.5: the login email field has no autocomplete="email".',
    });
    // Known problem in the app: expected to fail until it is fixed.
    test.fail();

    await expect(page.getByTestId('email')).toHaveAttribute('autocomplete', 'email');
  });
});

// Returns 'none' when the element has neither an outline nor a visible box-shadow.
async function focusIndicator(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const s = getComputedStyle(el);
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) return 'outline';
    const shadowVisible =
      s.boxShadow !== 'none' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(s.boxShadow);
    return shadowVisible ? 'box-shadow' : 'none';
  });
}
