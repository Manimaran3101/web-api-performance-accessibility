import { test, expect } from '@playwright/test';

// APIs have no screen, but the page can only be accessible if the API gives it the right
// data: alt text for images, and error messages a person can read.

interface Product {
  id: string;
  name: string;
  product_image: { title: string; file_name: string } | null;
}

test.describe('API data that accessibility depends on', { tag: '@a11y-api' }, () => {
  test('every product image has alt text, and it is not a file name', async ({ request }) => {
    const res = await request.get('/products?page=1');
    expect(res.status()).toBe(200);
    const products: Product[] = (await res.json()).data;

    for (const p of products) {
      const alt = p.product_image?.title?.trim() ?? '';
      expect.soft(alt, `${p.name}: image title (alt text)`).not.toBe('');
      expect
        .soft(alt, `${p.name}: alt text looks like a file name`)
        .not.toMatch(/\.(avif|jpe?g|png|webp)$/i);
    }
  });

  test('different products have different alt text', async ({ request }) => {
    test.info().annotations.push({
      type: 'known issue',
      description:
        'WCAG 1.1.1: e.g. "Thor Hammer" and "Hammer" both use alt text "Hammer", so a ' +
        'screen-reader user cannot tell the images apart.',
    });
    // Known problem in the data: expected to fail until it is fixed.
    test.fail();

    const products: Product[] = (await (await request.get('/products?page=1')).json()).data;
    const byAlt = new Map<string, string[]>();
    for (const p of products) {
      const alt = p.product_image?.title ?? '';
      byAlt.set(alt, [...(byAlt.get(alt) ?? []), p.name]);
    }
    const shared = [...byAlt].filter(([, names]) => new Set(names).size > 1);
    expect(shared, 'alt texts used by more than one product').toEqual([]);
  });

  test('validation errors name each field in plain language', async ({ request }) => {
    const res = await request.post('/users/register', {
      data: {},
      headers: { Accept: 'application/json' },
    });
    expect(res.status()).toBe(422);
    const errors: Record<string, string[]> = await res.json();

    // One message per field lets the page show it next to that field (WCAG 3.3.1).
    for (const field of ['first_name', 'last_name', 'email', 'password']) {
      expect.soft(errors[field]?.[0], `message for ${field}`).toMatch(/\w+ \w+/);
    }
  });

  test('an invalid email address gets its own error message', async ({ request }) => {
    test.info().annotations.push({
      type: 'known issue',
      description: 'POST /users/register with email "not-an-email" returns no email error.',
    });
    // Known problem in the API: expected to fail until it is fixed.
    test.fail();

    const res = await request.post('/users/register', {
      data: { email: 'not-an-email' },
      headers: { Accept: 'application/json' },
    });
    const errors: Record<string, string[]> = await res.json();
    expect(errors.email?.[0]).toBeTruthy();
  });

  test('a missing item returns a readable message, not a stack trace', async ({ request }) => {
    const res = await request.get('/products/does-not-exist');
    expect(res.status()).toBe(404);
    expect(res.headers()['content-type']).toContain('application/json');

    const body = await res.json();
    expect(body.message).toMatch(/not found/i);
    expect(JSON.stringify(body)).not.toMatch(/exception|stack|trace|vendor\//i);
  });
});
