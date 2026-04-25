import { Component, inject } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, moonOutline, sunnyOutline, libraryOutline } from 'ionicons/icons';
import { ThemeService } from '@apex-team/client/ui/theme';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  readonly themeService = inject(ThemeService);

  constructor() {
    addIcons({ peopleOutline, moonOutline, sunnyOutline, libraryOutline });
  }
}
