import { Component, input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

export type LoadingVariant = 'spinner' | 'list' | 'card';

@Component({
  selector: 'ap-loading',
  standalone: true,
  imports: [IonSpinner],
  templateUrl: './loading.html',
})
export class Loading {
  variant = input<LoadingVariant>('spinner');
  count = input<number>(3);

  get rows(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
