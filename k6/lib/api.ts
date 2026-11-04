import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { API_URL, SEEDED_USER } from '../config.ts';

const SEARCH_TERMS = ['hammer', 'pliers', 'saw', 'drill', 'screwdriver'];

// The name tag groups URLs: /products/01ABC and /products/01XYZ both count as one endpoint.
function params(name: string) {
  return { headers: { Accept: 'application/json' }, tags: { name } };
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// A shopper looking around: list, open a product, search, look at categories.
export function browseCatalogue(): void {
  let productIds: string[] = [];

  group('list products', () => {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${API_URL}/products?page=${page}`, params('GET /products'));
    check(res, {
      'list: status 200': (r) => r.status === 200,
      'list: has products': (r) => ((r.json('data') as unknown[]) ?? []).length > 0,
    });
    productIds = (res.json('data.#.id') as string[]) ?? [];
  });
  sleep(1);

  if (productIds.length > 0) {
    group('product details', () => {
      const res = http.get(`${API_URL}/products/${pick(productIds)}`, params('GET /products/{id}'));
      check(res, {
        'details: status 200': (r) => r.status === 200,
        'details: has price': (r) => typeof r.json('price') === 'number',
      });
    });
    sleep(1);
  }

  group('search', () => {
    const term = pick(SEARCH_TERMS);
    const res = http.get(`${API_URL}/products/search?q=${term}`, params('GET /products/search'));
    check(res, { 'search: status 200': (r) => r.status === 200 });
  });
  sleep(1);

  group('categories', () => {
    const res = http.get(`${API_URL}/categories/tree`, params('GET /categories/tree'));
    check(res, { 'categories: status 200': (r) => r.status === 200 });
  });
  sleep(Math.random() * 2 + 1);
}

// Login with the seeded user. Only used against my own copy of the app.
export function login(): void {
  const res = http.post(`${API_URL}/users/login`, JSON.stringify(SEEDED_USER), {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    tags: { name: 'POST /users/login' },
  });
  check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: has token': (r) => typeof r.json('access_token') === 'string',
  });
}
