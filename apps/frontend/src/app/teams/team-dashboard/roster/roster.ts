import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, pencilOutline, trashOutline } from 'ionicons/icons';
import { PlayersService, PlayerEntity, CreatePlayerDto, UpdatePlayerDto } from '../../players.service';
import { PlayerModal } from '../../player-modal/player-modal';

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
  ],
  templateUrl: './roster.html',
})
export class Roster {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly playersService = inject(PlayersService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  protected players = signal<PlayerEntity[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, pencilOutline, trashOutline });

    // Load players whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadPlayers(id);
      }
    });
  }

  protected async loadPlayers(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const players = await firstValueFrom(this.playersService.getPlayers(teamId));
      this.players.set(players);
    } catch {
      this.errorMessage.set('Failed to load roster. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async deletePlayer(playerId: string): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: 'Remove Player?',
      message: 'Are you sure you want to remove this player from the roster?',
      buttons: [
        'Cancel',
        {
          text: 'Remove',
          role: 'confirm',
          handler: async () => {
            try {
              await firstValueFrom(this.playersService.deletePlayer(teamId, playerId));
              this.players.update((list) => list.filter((p) => p.id !== playerId));
            } catch {
              this.errorMessage.set('Failed to remove player. Please try again.');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  protected async openPlayerModal(player?: PlayerEntity): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PlayerModal,
      componentProps: player ? { player } : {},
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<CreatePlayerDto>();
    if (role !== 'confirm' || !data) return;

    try {
      if (player?.id) {
        const updated = await firstValueFrom(
          this.playersService.updatePlayer(this.teamId, player.id, data as UpdatePlayerDto)
        );
        this.players.update((list) =>
          list.map((p) => (p.id === player.id ? updated : p))
        );
      } else {
        const created = await firstValueFrom(
          this.playersService.addPlayer(this.teamId, data as CreatePlayerDto)
        );
        this.players.update((list) => [...list, created]);
      }
    } catch {
      this.errorMessage.set('Failed to save player. Please try again.');
    }
  }
}
