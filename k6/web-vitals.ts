// Web performance with k6 browser: loads key pages in headless Chromium and checks
// Core Web Vitals. k6 records them automatically as browser_web_vital_* metrics.
import { browser } from 'k6/browser';
import exec from 'k6/execution';
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { API_URL, BASE_URL, PROFILE } from './config.ts';
import { summaryFor } from './lib/summary.ts';

// Google's "good" limits for the public site. In CI the app runs as an unminified
// development build, so only big regressions should fail there.
const BUDGET =
  PROFILE === 'public'
    ? { lcp: 2500, fcp: 1800, ttfb: 800, cls: 0.1 }
    : { lcp: 6000, fcp: 4000, ttfb: 1500, cls: 0.1 };

const ROUNDS = 5;

// Thresholds on a metric with no data pass. This counter makes sure every page was
// really measured in every round, so a broken page load can't hide behind a green run.
const pagesMeasured = new Counter('pages_measured');

// Known issue: the product page moves while it loads (CLS 0.1 average, up to 0.44 seen
// in CI). Until it is fixed it may stay in Google's "needs improvement" band but must not
// get worse than that ("poor" starts at 0.25). See README "Findings".
const KNOWN_CLS: Record<string, number> = { product: 0.25 };

// Each page gets its own limits, so a failure says which page it is.
function pageThresholds(name: string) {
  return {
    [`pages_measured{page:${name}}`]: [`count>=${ROUNDS}`],
    [`browser_web_vital_lcp{page:${name}}`]: [`p(75)<${BUDGET.lcp}`],
    [`browser_web_vital_fcp{page:${name}}`]: [`p(75)<${BUDGET.fcp}`],
    [`browser_web_vital_ttfb{page:${name}}`]: [`p(75)<${BUDGET.ttfb}`],
    [`browser_web_vital_cls{page:${name}}`]: [`p(75)<${KNOWN_CLS[name] ?? BUDGET.cls}`],
  };
}

export const options = {
  scenarios: {
    pages: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: ROUNDS,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    ...pageThresholds('home'),
    ...pageThresholds('product'),
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

// Opens one page in its own browser context, waits for its key element, then closes it.
// CLS is only final when the page is left, so it is closed before the tag changes.
// k6 browser allows one context at a time, so each one must be closed before the next.
async function measure(name: string, url: string, readySelector: string): Promise<void> {
  exec.vu.metrics.tags.page = name;
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load' });
    const ready = page.locator(readySelector).first();
    await ready.waitFor({ state: 'visible' });
    check(await ready.textContent(), { [`${name}: content shown`]: (t) => !!t?.trim() });
    pagesMeasured.add(1);
  } finally {
    await page.close();
    await context.close();
  }
}

export default async function (data: { productId: string }) {
  await measure('home', BASE_URL, '[data-test="product-name"]');
  await measure('product', `${BASE_URL}/product/${data.productId}`, '[data-test="product-name"]');
  delete exec.vu.metrics.tags.page;
}

export const handleSummary = summaryFor('web-vitals');
