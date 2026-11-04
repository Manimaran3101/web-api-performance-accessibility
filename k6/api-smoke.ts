// Smoke: one user, a few rounds. "Does the API work and is it roughly fast enough?"
// Safe to run against the public demo.
import { browseCatalogue } from './lib/api.ts';
import { PROFILE } from './config.ts';
import { summaryFor } from './lib/summary.ts';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // The public demo sometimes has slow cold starts, so its limit is higher.
    http_req_duration: [PROFILE === 'public' ? 'p(95)<2000' : 'p(95)<500'],
    checks: ['rate==1.0'],
  },
};

export default function () {
  browseCatalogue();
}

export const handleSummary = summaryFor('api-smoke');
