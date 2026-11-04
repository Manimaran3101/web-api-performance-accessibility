// Load: expected busy-day traffic. Shoppers browsing (ramping users) plus a steady
// rate of logins. Fails if response times or the error rate go over the limits.
import { browseCatalogue, login } from './lib/api.ts';
import { refusePublicTarget } from './config.ts';
import { summaryFor } from './lib/summary.ts';

refusePublicTarget('The load test');

export const options = {
  scenarios: {
    shoppers: {
      executor: 'ramping-vus',
      exec: 'shoppers',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 }, // ramp up
        { duration: '2m', target: 20 }, // hold
        { duration: '30s', target: 0 }, // ramp down
      ],
    },
    logins: {
      // Arrival rate: new logins start at this pace even if the API gets slow.
      executor: 'constant-arrival-rate',
      exec: 'logins',
      rate: 2,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{name:GET /products/search}': ['p(95)<1000'],
    'http_req_duration{name:POST /users/login}': ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

export function shoppers() {
  browseCatalogue();
}

export function logins() {
  login();
}

export const handleSummary = summaryFor('api-load');
