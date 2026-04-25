import { Component, input } from '@angular/core';

@Component({
  selector: 'ap-section-label',
  standalone: true,
  imports: [],
  templateUrl: './section-label.html',
})
export class SectionLabel {
  label = input.required<string>();
}
