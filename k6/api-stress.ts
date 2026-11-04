// Stress: keep raising the request rate to find where the API starts to break.
// The test stops early once more than 10% of requests fail; the summary shows how far it got.
import { browseCatalogue } from './lib/api.ts';
import { refusePublicTarget } from './config.ts';
import { summaryFor } from './lib/summary.ts';

refusePublicTarget('The stress test');

export const options = {
  scenarios: {
    rising_traffic: {
      executor: 'ramping-arrival-rate',
      exec: 'shoppers',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 300,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 75 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    // Stop when the API is clearly broken, after a 30s grace period.
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' }],
    // Not a pass/fail goal here, only reported so I can see how latency grows.
    http_req_duration: ['p(95)<3000'],
  },
};

export function shoppers() {
  browseCatalogue();
}

export const handleSummary = summaryFor('api-stress');
