import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldOutline,
  createOutline,
  trashOutline,
  addOutline,
  warningOutline,
  calendarOutline,
  footballOutline,
  locationOutline,
  trophyOutline,
  documentTextOutline,
  peopleOutline,
  sendOutline,
  chatboxEllipsesOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { OpponentsService } from '@apex-team/client/data-access/team';
import {
  OpponentWithStats,
  DangerPlayer,
  OpponentScoutingNote,
  ThreatLevel,
} from '@apex-team/shared/util/models';
import { OpponentModal } from '../opponent-modal/opponent-modal';
import { DangerPlayerModal } from '../danger-player-modal/danger-player-modal';

@Component({
  selector: 'app-opponent-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
  ],
  templateUrl: './opponent-detail.html',
  styleUrl: './opponent-detail.scss',
})
export class OpponentDetail {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }
  @Input() set opponentId(val: string) {
    this._opponentId.set(val);
  }

  private _teamId = signal<string | null>(null);
  private _opponentId = signal<string | null>(null);

  public get teamId(): string {
    return this._teamId() || this.route.snapshot.paramMap.get('id') || '';
  }

  public get oppId(): string {
    return this._opponentId() || this.route.snapshot.paramMap.get('opponentId') || '';
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly opponentsService = inject(OpponentsService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  protected opponent = signal<OpponentWithStats | null>(null);
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  // New scouting note input
  protected newScoutingNoteContent = signal<string>('');
  protected isAddingNote = signal(false);

  constructor() {
    addIcons({
      shieldOutline,
      createOutline,
      trashOutline,
      addOutline,
      warningOutline,
      calendarOutline,
      footballOutline,
      locationOutline,
      trophyOutline,
      documentTextOutline,
      peopleOutline,
      sendOutline,
      chatboxEllipsesOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
    });

    effect(() => {
      const tid = this.teamId;
      const oid = this.oppId;
      if (tid && oid) {
        void this.loadOpponent(tid, oid);
      }
    });
  }

  ionViewWillEnter(): void {
    const tid = this.teamId;
    const oid = this.oppId;
    if (tid && oid) {
      void this.loadOpponent(tid, oid);
    }
  }

  protected async loadOpponent(teamId: string, opponentId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(
        this.opponentsService.getOpponent(teamId, opponentId),
      );
      this.opponent.set(data);
    } catch {
      this.errorMessage.set('Failed to load opponent dossier.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openEditModal(): Promise<void> {
    const opp = this.opponent();
    if (!opp) return;

    const modal = await this.modalCtrl.create({
      component: OpponentModal,
      componentProps: {
        teamId: this.teamId,
        opponent: opp,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data) {
      await this.loadOpponent(this.teamId, this.oppId);
    }
  }

  protected async confirmDelete(): Promise<void> {
    const opp = this.opponent();
    if (!opp) return;

    const alert = await this.alertCtrl.create({
      header: 'Delete Opponent Dossier?',
      message: `Are you sure you want to delete the scouting dossier for "${opp.name}"? Past match results will be preserved.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.deleteOpponent();
          },
        },
      ],
    });

    await alert.present();
  }

  private async deleteOpponent(): Promise<void> {
    try {
      await firstValueFrom(
        this.opponentsService.deleteOpponent(this.teamId, this.oppId),
      );
      void this.router.navigate(['/teams', this.teamId, 'opponents']);
    } catch {
      console.error('Failed to delete opponent');
    }
  }

  // Dangerous Players
  protected async openAddDangerPlayerModal(player?: DangerPlayer): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: DangerPlayerModal,
      componentProps: { player },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data) {
      await this.saveDangerPlayer(data as DangerPlayer);
    }
  }

  private async saveDangerPlayer(player: DangerPlayer): Promise<void> {
    const opp = this.opponent();
    if (!opp) return;

    const existingPlayers = [...(opp.dangerPlayers || [])];
    if (player.id) {
      const idx = existingPlayers.findIndex((p) => p.id === player.id);
      if (idx >= 0) existingPlayers[idx] = player;
      else existingPlayers.push(player);
    } else {
      existingPlayers.push(player);
    }

    try {
      const updated = await firstValueFrom(
        this.opponentsService.updateOpponent(this.teamId, opp.id, {
          dangerPlayers: existingPlayers,
        }),
      );
      this.opponent.update((curr) => curr ? { ...curr, dangerPlayers: updated.dangerPlayers } : null);
    } catch {
      console.error('Failed to save dangerous player');
    }
  }

  protected async deleteDangerPlayer(playerId: string): Promise<void> {
    const opp = this.opponent();
    if (!opp) return;

    const updatedPlayers = (opp.dangerPlayers || []).filter((p) => p.id !== playerId);

    try {
      const updated = await firstValueFrom(
        this.opponentsService.updateOpponent(this.teamId, opp.id, {
          dangerPlayers: updatedPlayers,
        }),
      );
      this.opponent.update((curr) => curr ? { ...curr, dangerPlayers: updated.dangerPlayers } : null);
    } catch {
      console.error('Failed to remove dangerous player');
    }
  }

  // Scouting Notes
  protected async addScoutingNote(): Promise<void> {
    const content = this.newScoutingNoteContent().trim();
    if (!content) return;

    this.isAddingNote.set(true);
    try {
      const note = await firstValueFrom(
        this.opponentsService.addScoutingNote(this.teamId, this.oppId, { content }),
      );

      this.opponent.update((curr) => {
        if (!curr) return null;
        const notes = [note, ...(curr.scoutingNotes || [])];
        return { ...curr, scoutingNotes: notes };
      });

      this.newScoutingNoteContent.set('');
    } catch {
      console.error('Failed to add scouting note');
    } finally {
      this.isAddingNote.set(false);
    }
  }

  protected async deleteScoutingNote(noteId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.opponentsService.deleteScoutingNote(this.teamId, this.oppId, noteId),
      );
      this.opponent.update((curr) => {
        if (!curr) return null;
        return {
          ...curr,
          scoutingNotes: (curr.scoutingNotes || []).filter((n) => n.id !== noteId),
        };
      });
    } catch {
      console.error('Failed to delete scouting note');
    }
  }

  protected getThreatBadgeClass(threatLevel?: ThreatLevel | null): string {
    switch (threatLevel) {
      case 'critical':
        return 'bg-red-500/20 text-red-500 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-500 border border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  }
}
