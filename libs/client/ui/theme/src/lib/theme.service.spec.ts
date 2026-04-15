import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageStore: Record<string, string>;

  function createLocalStorageMock(): Storage {
    localStorageStore = {};
    return {
      getItem: (key: string) => localStorageStore[key] ?? null,
      setItem: (key: string, value: string) => { localStorageStore[key] = value; },
      removeItem: (key: string) => { delete localStorageStore[key]; },
      clear: () => { localStorageStore = {}; },
      key: (index: number) => Object.keys(localStorageStore)[index] ?? null,
      get length() { return Object.keys(localStorageStore).length; },
    } as Storage;
  }

  function mockMatchMedia(prefersDark: boolean): void {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: prefersDark && query.includes('dark'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
    mockMatchMedia(false); // OS: light by default
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default to light theme when OS is light and no stored preference', () => {
    expect(service.isDark()).toBe(false);
  });

  it('should default to dark theme when OS prefers dark and no stored preference', () => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
    mockMatchMedia(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
  });

  it('should read stored theme from localStorage on init', () => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    localStorage.setItem('theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
  });

  it('should set isDark() to true after toggle from light', () => {
    service.toggle();
    expect(service.isDark()).toBe(true);
  });

  it('should apply .dark class to document.documentElement on toggle', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply .ion-palette-dark class to document.documentElement on toggle', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('should persist dark to localStorage on toggle', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should remove both .dark and .ion-palette-dark on double toggle', () => {
    service.toggle(); // → dark
    TestBed.flushEffects();
    service.toggle(); // → light
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
  });
});
