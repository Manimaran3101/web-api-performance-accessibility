// k6 loads this module from jslib.k6.io at run time; this only tells TypeScript its shape.
declare module 'https://jslib.k6.io/k6-summary/0.1.0/index.js' {
  export function textSummary(
    data: object,
    options?: { indent?: string; enableColors?: boolean },
  ): string;
}
