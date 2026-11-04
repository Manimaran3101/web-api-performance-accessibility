// Stress: keep raising the rate of shopper journeys (4 requests each) to find where the
// API starts to break. Stops early once more than 10% of requests fail.
import { browseCatalogue } from './lib/api.ts';
import { refusePublicTarget } from './config.ts';
import { summaryFor } from './lib/summary.ts';

refusePublicTarget('The stress test');

export const options = {
  scenarios: {
    rising_traffic: {
      executor: 'ramping-arrival-rate',
      exec: 'shoppers',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 400,
      stages: [
        { duration: '1m', target: 25 }, // ~100 requests/s
        { duration: '1m', target: 75 }, // ~300 requests/s
        { duration: '1m', target: 150 }, // ~600 requests/s
        { duration: '1m', target: 250 }, // ~1000 requests/s
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    // Stop when the API is clearly broken, after a 30s grace period.
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' }],
    // Reported so I can see how latency grows; the limit is loose on purpose.
    http_req_duration: ['p(95)<3000'],
  },
  // dropped_iterations is shown in the summary but is not a pass/fail limit here: once the
  // API slows down, k6 runs out of VUs and drops iterations. That is the result I want to
  // see. (If it happens while responses are still fast, the test setup is the bottleneck.)
};

export function shoppers() {
  browseCatalogue(false);
}

export const handleSummary = summaryFor('api-stress');
