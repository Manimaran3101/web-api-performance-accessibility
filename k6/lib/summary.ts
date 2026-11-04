// End-of-test output: the normal text summary in the terminal, plus a JSON file for CI.
// The HTML report comes from k6's built-in web dashboard (K6_WEB_DASHBOARD_EXPORT), see README.
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

export function summaryFor(name: string) {
  return (data: object) => ({
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`reports/${name}-summary.json`]: JSON.stringify(data, null, 2),
  });
}
