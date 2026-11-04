// Web performance with k6 browser: loads key pages in headless Chromium and checks
// Core Web Vitals. k6 records them automatically as browser_web_vital_* metrics.
import { browser } from 'k6/browser';
import http from 'k6/http';
import { check } from 'k6';
import { API_URL, BASE_URL, PROFILE } from './config.ts';
import { summaryFor } from './lib/summary.ts';

// Google's "good" limits for the public site. In CI the app runs as an unminified
// development build, so only big regressions should fail there.
const BUDGET =
  PROFILE === 'public'
    ? { lcp: 2500, fcp: 1800, ttfb: 800, cls: 0.1 }
    : { lcp: 6000, fcp: 4000, ttfb: 1500, cls: 0.1 };

export const options = {
  scenarios: {
    pages: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    browser_web_vital_lcp: [`p(75)<${BUDGET.lcp}`],
    browser_web_vital_fcp: [`p(75)<${BUDGET.fcp}`],
    browser_web_vital_ttfb: [`p(75)<${BUDGET.ttfb}`],
    browser_web_vital_cls: [`p(75)<${BUDGET.cls}`],
    checks: ['rate==1.0'],
  },
};

// Runs once before the test: pick a real product so the product page URL is valid.
export function setup() {
  const res = http.get(`${API_URL}/products?page=1`, { headers: { Accept: 'application/json' } });
  const ids = (res.json('data.#.id') as string[]) ?? [];
  if (ids.length === 0) throw new Error(`No products returned by ${API_URL}/products`);
  return { productId: ids[0] };
}

export default async function (data: { productId: string }) {
  const page = await browser.newPage();
  try {
    // Home page: wait until the product grid is really there.
    await page.goto(BASE_URL, { waitUntil: 'load' });
    const firstCard = page.locator('[data-test="product-name"]').first();
    await firstCard.waitFor({ state: 'visible' });
    check(await firstCard.textContent(), { 'home: product grid shown': (t) => !!t?.trim() });

    // Product page as a fresh load, so its own LCP is measured.
    await page.goto(`${BASE_URL}/product/${data.productId}`, { waitUntil: 'load' });
    const title = page.locator('[data-test="product-name"]');
    await title.waitFor({ state: 'visible' });
    check(await title.textContent(), { 'product: title shown': (t) => !!t?.trim() });
  } finally {
    await page.close();
  }
}

export const handleSummary = summaryFor('web-vitals');
