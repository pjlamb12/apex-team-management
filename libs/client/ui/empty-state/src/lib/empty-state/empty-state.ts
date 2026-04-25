import { Component, input, output } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'ap-empty-state',
  standalone: true,
  imports: [IonIcon, IonButton],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  icon = input<string>('alert-circle-outline');
  title = input.required<string>();
  message = input<string>('');
  actionLabel = input<string>('');

  actionClick = output<void>();

  constructor() {
    addIcons({ alertCircleOutline });
  }
}
