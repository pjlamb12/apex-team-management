import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowUndoOutline,
  refreshOutline,
  swapHorizontalOutline,
  addCircleOutline,
  removeCircleOutline,
  closeOutline,
  flashOutline,
  arrowDownCircleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Player } from '@apex-team/shared/util/models';

export interface KeypadActionPayload {
  type: string;
  playerId: string;
  payload?: Record<string, unknown>;
}

export interface ArmedStatState {
  type: string;
  label: string;
  payload?: Record<string, unknown>;
}

@Component({
  selector: 'app-volleyball-stat-pad',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './volleyball-stat-pad.html',
  styleUrls: ['./volleyball-stat-pad.scss'],
})
export class VolleyballStatPadComponent {
  // Inputs
  selectedPlayer = input<Player | null>(null);
  activePlayers = input<Player[]>([]);
  canUndo = input<boolean>(true);
  isLiberoOnCourt = input<boolean>(false);
  hasLibero = input<boolean>(false);

  // Outputs
  actionTriggered = output<KeypadActionPayload>();
  undoClicked = output<void>();
  rotateClicked = output<void>();
  addPointUs = output<void>();
  addPointOpp = output<void>();
  quickLiberoSwap = output<void>();
  subOffClicked = output<Player>();
  armedStatChanged = output<string | null>();
  playerDeselected = output<void>();

  // State: when stat key is tapped first without a player selected
  armedStat = signal<ArmedStatState | null>(null);

  constructor() {
    addIcons({
      arrowUndoOutline,
      refreshOutline,
      swapHorizontalOutline,
      addCircleOutline,
      removeCircleOutline,
      closeOutline,
      flashOutline,
      arrowDownCircleOutline,
      shieldCheckmarkOutline,
    });
  }

  /**
   * Handle tapping any stat key on the keypad
   */
  public handleKeypadPress(actionType: string, label: string, payload?: Record<string, unknown>): void {
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
        payload,
      });
      void this.triggerHaptic(ImpactStyle.Medium);
      this.clearArmedStat();
    } else {
      // Flow B: No player selected -> Arm the stat key
      const current = this.armedStat();
      if (current && current.type === actionType && JSON.stringify(current.payload) === JSON.stringify(payload)) {
        // Toggle off if already armed
        this.clearArmedStat();
      } else {
        this.armedStat.set({ type: actionType, label, payload });
        this.armedStatChanged.emit(actionType);
        void this.triggerHaptic(ImpactStyle.Light);
      }
    }
  }

  /**
   * When an armed stat is pending and user taps a player (e.g. from strip or court)
   */
  public fulfillArmedStat(player: Player): boolean {
    const armed = this.armedStat();
    if (!armed) return false;

    this.actionTriggered.emit({
      type: armed.type,
      playerId: player.id,
      payload: armed.payload,
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

  public handleRotate(): void {
    this.rotateClicked.emit();
    void this.triggerHaptic(ImpactStyle.Medium);
  }

  public handleAddPointUs(): void {
    this.addPointUs.emit();
    void this.triggerHaptic(ImpactStyle.Light);
  }

  public handleAddPointOpp(): void {
    this.addPointOpp.emit();
    void this.triggerHaptic(ImpactStyle.Light);
  }

  public handleQuickLiberoSwap(): void {
    this.quickLiberoSwap.emit();
    void this.triggerHaptic(ImpactStyle.Medium);
  }

  public isStatArmed(type: string, payloadMatch?: Record<string, unknown>): boolean {
    const armed = this.armedStat();
    if (!armed) return false;
    if (armed.type !== type) return false;
    if (payloadMatch !== undefined) {
      return armed.payload?.score === payloadMatch?.score;
    }
    return true;
  }

  private async triggerHaptic(style: ImpactStyle): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      // ignore on non-Capacitor environments
    }
  }
}
