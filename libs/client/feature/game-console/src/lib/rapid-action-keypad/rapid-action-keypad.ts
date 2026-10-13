import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowUndoOutline,
  basketballOutline,
  handLeftOutline,
  shieldOutline,
  warningOutline,
  arrowDownCircleOutline,
  flashOutline,
  closeOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Player } from '@apex-team/shared/util/models';

export interface KeypadActionPayload {
  type: string;
  playerId: string;
  payload?: any;
}

@Component({
  selector: 'app-rapid-action-keypad',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './rapid-action-keypad.html',
  styleUrls: ['./rapid-action-keypad.scss'],
})
export class RapidActionKeypadComponent {
  // Inputs
  selectedPlayer = input<Player | null>(null);
  activePlayers = input<Player[]>([]);
  canUndo = input<boolean>(true);
  teamFouls = input<number>(0);
  bonusThreshold = input<number>(5);

  // Outputs
  actionTriggered = output<KeypadActionPayload>();
  undoClicked = output<void>();
  subOffClicked = output<Player>();
  armedStatChanged = output<string | null>();
  playerDeselected = output<void>();

  // State: when stat key is tapped first without a player selected
  armedStat = signal<string | null>(null);

  constructor() {
    addIcons({
      arrowUndoOutline,
      basketballOutline,
      handLeftOutline,
      shieldOutline,
      warningOutline,
      arrowDownCircleOutline,
      flashOutline,
      closeOutline,
    });
  }

  /**
   * Handle tapping any stat key on the keypad
   */
  public handleKeypadPress(actionType: string): void {
    const player = this.selectedPlayer();

    if (actionType === 'SUB_OFF') {
      if (player) {
        this.subOffClicked.emit(player);
        void this.triggerHaptic(ImpactStyle.Medium);
      }
      return;
    }

    if (player) {
      // Flow A: Player already selected -> immediately emit action
      this.actionTriggered.emit({
        type: actionType,
        playerId: player.id,
      });
      void this.triggerHaptic(ImpactStyle.Medium);
      this.clearArmedStat();
    } else {
      // Flow B: No player selected -> Arm the stat key
      if (this.armedStat() === actionType) {
        // Toggle off if already armed
        this.clearArmedStat();
      } else {
        this.armedStat.set(actionType);
        this.armedStatChanged.emit(actionType);
        void this.triggerHaptic(ImpactStyle.Light);
      }
    }
  }

  /**
   * When an armed stat is pending and user taps a player (e.g. from strip or modal)
   */
  public fulfillArmedStat(player: Player): boolean {
    const armed = this.armedStat();
    if (!armed) return false;

    this.actionTriggered.emit({
      type: armed,
      playerId: player.id,
    });

    void this.triggerHaptic(ImpactStyle.Medium);
    this.clearArmedStat();
    return true;
  }

  public clearArmedStat(): void {
    this.armedStat.set(null);
    this.armedStatChanged.emit(null);
  }

  public handleDeselect(): void {
    this.playerDeselected.emit();
    this.clearArmedStat();
  }

  public handleUndo(): void {
    if (!this.canUndo()) return;
    this.undoClicked.emit();
    void this.triggerHaptic(ImpactStyle.Medium);
  }

  private async triggerHaptic(style: ImpactStyle): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      // ignore in non-mobile environments
    }
  }
}
