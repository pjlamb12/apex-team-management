import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

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
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
    mockMatchMedia(false); // OS: light by default
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should default to light theme when OS is light and no stored preference', () => {
    expect(service.isDark()).toBe(false);
  });

  it('should default to dark theme when OS prefers dark and no stored preference', () => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
    mockMatchMedia(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
  });

  it('should read stored theme from localStorage on init', () => {
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
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply .ion-palette-dark class to document.documentElement on toggle', () => {
    service.toggle();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('should persist dark to localStorage on toggle', () => {
    service.toggle();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should remove both .dark and .ion-palette-dark on double toggle', () => {
    service.toggle(); // → dark
    service.toggle(); // → light
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
  });
});
