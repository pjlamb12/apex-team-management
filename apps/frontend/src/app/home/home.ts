import { Component, inject } from '@angular/core';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
} from '@ionic/angular/standalone';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}
