import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, peopleOutline } from 'ionicons/icons';
import { ThemeToggle } from '@apex-team/client/ui/theme-toggle';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    ThemeToggle,
  ],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.scss',
})
export class AccessDenied {
  constructor() {
    addIcons({
      lockClosedOutline,
      peopleOutline,
    });
  }
}
