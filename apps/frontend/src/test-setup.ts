import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// Mock localStorage globally
const localStorageStore: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => {
    for (const key in localStorageStore) {
      delete localStorageStore[key];
    }
  },
  key: (index: number) => Object.keys(localStorageStore)[index] ?? null,
  get length() { return Object.keys(localStorageStore).length; },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia globally
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
