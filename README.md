# Web and API performance + accessibility tests

Performance tests with **k6** and accessibility tests with **Playwright + axe-core**, for both the web UI and the REST API of the [Toolshop demo app](https://practicesoftwaretesting.com).

## What is tested

| Area              | Tool             | Tests                                                                                                                      |
| ----------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| API performance   | k6               | Smoke (1 user), load (20 shoppers + 2 logins/s for 3 min), stress (rising to 75 requests/s until it breaks)                |
| Web performance   | k6 browser       | Core Web Vitals (LCP, FCP, TTFB, CLS) on the home page and a product page                                                  |
| Web accessibility | Playwright + axe | WCAG 2.2 AA scans on 6 page states, keyboard-only login, focus indicator, reflow at 320px, ARIA snapshot of the login form |
| API accessibility | Playwright       | The API gives the page what it needs: image alt text, one readable error per field, no stack traces                        |

APIs have no screen, so WCAG does not apply to them directly. But a page can only be accessible if the API sends the right data, for example a real alt text for each product image. That is what the API accessibility tests check.

## Findings

Problems the tests found in the app. Each one is pinned by a test, so it stays visible in the report and the test tells me when it gets fixed.

| #   | Problem                                                                | WCAG               | Test                    |
| --- | ---------------------------------------------------------------------- | ------------------ | ----------------------- |
| 1   | Show-password button has no name; a screen reader only says "button"   | 4.1.2              | axe scan, ARIA snapshot |
| 2   | Language button: visible text "EN" is not part of its accessible name  | 2.5.3              | axe scan                |
| 3   | Lists with non-`<li>` children (filters, password help)                | 1.3.1              | axe scan                |
| 4   | "More information" links on the product page are smaller than 24x24 px | 2.5.8 (new in 2.2) | axe scan                |
| 5   | Login email field has no `autocomplete="email"`                        | 1.3.5              | `keyboard.spec.ts`      |
| 6   | Different products share the same image alt text (e.g. "Hammer")       | 1.1.1              | `a11y-data.spec.ts`     |
| 7   | Registering with email "not-an-email" returns no email error           | 3.3.1              | `a11y-data.spec.ts`     |

Things that work well: error messages are linked to their fields (`aria-invalid` + `aria-describedby`), the Tab order is logical, and pages reflow at 320px without sideways scrolling.

Known axe problems are listed in [`src/known-issues.ts`](src/known-issues.ts). The scans only fail on a new serious or critical problem.

## Why load tests never run against the public demo

The public demo is shared by many people, and putting real load on someone else's site is not OK. So:

- Locally, only the **smoke** test and **web vitals** run against the public demo. Both are 1 user and a few requests.
- **Load and stress** refuse to start unless `API_URL` points at `localhost`. In CI, every job starts its own copy of the app with Docker Compose ([`start-toolshop`](.github/actions/start-toolshop/action.yml)) and tests that.

## How to run

You need Node.js 20+ and [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`winget install k6` on Windows).

```bash
npm ci
npx playwright install chromium
```

| Command                   | What it does                                    |
| ------------------------- | ----------------------------------------------- |
| `npm run test:a11y`       | All accessibility tests (web + API)             |
| `npm run test:a11y:api`   | Only the API accessibility tests                |
| `npm run perf:api:smoke`  | k6 smoke test, safe against the public demo     |
| `npm run perf:web`        | k6 browser Core Web Vitals                      |
| `npm run perf:api:load`   | k6 load test (needs your own copy of the app)   |
| `npm run perf:api:stress` | k6 stress test (needs your own copy of the app) |

k6 browser needs Chromium. If Chrome is not installed, point it at Playwright's: set `K6_BROWSER_EXECUTABLE_PATH` (see [`.env.example`](.env.example)).

## Notes on how it works

- **Thresholds make k6 pass or fail.** For example `p(95)<800` means 95% of requests must finish in under 800 ms. Without thresholds a load test only prints numbers.
- **URLs are grouped by name.** `/products/01ABC` and `/products/01XYZ` are tagged `GET /products/{id}`, so the report shows one line per endpoint, not one per product.
- **Two kinds of load.** Shoppers use `ramping-vus` (a number of users). Logins use `constant-arrival-rate` (a number of requests per second). With arrival rate, a slow API does not reduce the load, which is closer to real traffic.
- **Stress stops itself.** It aborts once more than 10% of requests fail, and the summary shows the rate it reached.
- **Different budgets for CI.** In CI the app runs as an unminified development build, so the web vitals budget there only catches big regressions. Against the public site the budget is Google's "good" limit (LCP < 2.5 s).
- **One browser at a time locally.** axe scans use a lot of memory, and two at once on my laptop made pages time out.

## CI

[GitHub Actions](.github/workflows/ci.yml): lint and types first, then accessibility, API performance and web performance in parallel. Each job uploads its report (Playwright HTML report, k6 HTML dashboard and JSON summary). The stress test runs weekly or on demand.
