import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  protected theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const isDark = this.theme() === 'dark';
      // Pitfall 2: MUST apply BOTH classes simultaneously
      // .dark activates Tailwind dark: utility classes
      // .ion-palette-dark activates Ionic 8 dark palette CSS variables
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('ion-palette-dark', isDark);
      localStorage.setItem('theme', this.theme());
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return 'dark';
  }
}
