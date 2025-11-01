// Vitest setup file
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for tests
const indexedDB = {
  open: () => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      objectStoreNames: {
        contains: () => false,
      },
      createObjectStore: () => ({
        createIndex: () => {},
      }),
    },
  }),
};

global.indexedDB = indexedDB as any;
