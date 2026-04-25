import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StagedSub, LineupEntry } from '../live-game-state.service';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, trashOutline, flashOutline, closeCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-sub-queue',
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './sub-queue.html',
  styleUrls: ['./sub-queue.scss'],
})
export class SubQueueComponent {
  stagedSubs = input.required<StagedSub[]>();
  initialLineup = input.required<LineupEntry[]>();

  apply = output<void>();
  clear = output<void>();
  remove = output<string>(); // emits playerId to unstage

  constructor() {
    addIcons({ arrowForwardOutline, trashOutline, flashOutline, closeCircleOutline });
  }

  protected subViewModels = computed(() => {
    const subs = this.stagedSubs();
    const lineup = this.initialLineup();

    return subs.map(sub => {
      const inEntry = lineup.find(e => e.playerId === sub.inPlayerId);
      const outEntry = lineup.find(e => e.playerId === sub.outPlayerId);

      return {
        id: `${sub.inPlayerId}-${sub.outPlayerId}`,
        inPlayer: inEntry?.player,
        outPlayer: outEntry?.player,
        inPlayerId: sub.inPlayerId,
        outPlayerId: sub.outPlayerId
      };
    });
  });

  protected onRemove(playerId: string) {
    this.remove.emit(playerId);
  }

  protected onApply() {
    this.apply.emit();
  }

  protected onClear() {
    this.clear.emit();
  }
}
