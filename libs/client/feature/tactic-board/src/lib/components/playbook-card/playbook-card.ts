import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  easelOutline,
  createOutline,
  copyOutline,
  trashOutline,
  footballOutline,
  ellipseOutline,
  layersOutline,
} from 'ionicons/icons';
import { TacticPlay } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-playbook-card',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './playbook-card.html',
  styleUrl: './playbook-card.scss',
})
export class PlaybookCard {
  @Input({ required: true }) play!: TacticPlay;
  @Input() isSelected = false;

  @Output() loadPlay = new EventEmitter<TacticPlay>();
  @Output() editPlay = new EventEmitter<TacticPlay>();
  @Output() duplicatePlay = new EventEmitter<TacticPlay>();
  @Output() deletePlay = new EventEmitter<TacticPlay>();

  constructor() {
    addIcons({
      easelOutline,
      createOutline,
      copyOutline,
      trashOutline,
      footballOutline,
      ellipseOutline,
      layersOutline,
    });
  }

  get tokenCount(): number {
    return this.play.canvasData?.tokens?.length || 0;
  }

  get phaseCount(): number {
    return this.play.canvasData?.phases?.length || 1;
  }
}
