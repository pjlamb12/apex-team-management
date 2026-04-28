import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { ThemeService } from '@apex-team/client/ui/theme';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <ion-button
      (click)="themeService.toggle()"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      fill="clear"
      color="medium"
    >
      <ion-icon
        [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'"
        slot="icon-only"
      />
    </ion-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);

  constructor() {
    addIcons({ moonOutline, sunnyOutline });
  }
}
