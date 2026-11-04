// Settings shared by all k6 scripts. Override with -e NAME=value or environment variables.

export const BASE_URL = __ENV.BASE_URL || 'https://practicesoftwaretesting.com';
export const API_URL = __ENV.API_URL || 'https://api.practicesoftwaretesting.com';

// "public" = the shared demo site (light checks only), "ci" = my own copy of the app in Docker.
export const PROFILE = __ENV.PERF_PROFILE || (API_URL.includes('localhost') ? 'ci' : 'public');

// The public demo is shared by many people. Load and stress tests only run against my own copy.
export function refusePublicTarget(testName: string): void {
  const isPublic = !API_URL.includes('localhost') && !API_URL.includes('127.0.0.1');
  if (isPublic && __ENV.ALLOW_PUBLIC_LOAD !== 'true') {
    throw new Error(
      `${testName} puts real load on ${API_URL}. Run it against your own copy of the app ` +
        `(API_URL=http://localhost:8091), like CI does.`,
    );
  }
}

// Seeded user in a fresh copy of the app. On the public demo this account is often locked.
export const SEEDED_USER = {
  email: __ENV.SEEDED_EMAIL || 'customer@practicesoftwaretesting.com',
  password: __ENV.SEEDED_PASSWORD || 'welcome01',
};
