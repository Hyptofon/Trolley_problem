import '@testing-library/jest-dom/vitest';

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

