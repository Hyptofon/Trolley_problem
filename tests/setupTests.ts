import '@testing-library/jest-dom/vitest';

(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
process.env.VOTE_ID_HMAC_SECRET = 'test-secret-at-least-32-chars-long-1234567890';
process.env.REDIS_KEY_PREFIX = 'trolley:test:v1';
process.env.DEMO_MODE = 'true';

// Polyfill crypto.randomUUID if needed in jsdom
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
      subtle: globalThis.crypto?.subtle,
    },
    configurable: true,
  });
}
