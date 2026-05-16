import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  ModalController,
} from '@ionic/angular/standalone';
import { PlayersService, PlayerEntity, CandidatesService, CandidateEntity } from '@apex-team/client/data-access/team';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-season-roster-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
  ],
  templateUrl: './manage-roster-modal.html',
})
export class ManageSeasonRosterModal implements OnInit {
  @Input() teamId!: string;
  @Input() seasonId!: string;
  @Input() currentRosterPlayerIds: string[] = [];

  private readonly playersService = inject(PlayersService);
  private readonly candidatesService = inject(CandidatesService);
  private readonly modalCtrl = inject(ModalController);

  protected isLoading = signal(false);
  protected activeSegment = signal<'historical' | 'candidates'>('historical');
  
  protected historicalPlayers = signal<PlayerEntity[]>([]);
  protected availableCandidates = signal<CandidateEntity[]>([]);
  
  protected selectedPlayerIds = signal<Set<string>>(new Set());
  protected selectedCandidateIds = signal<Set<string>>(new Set());

  ngOnInit() {
    void this.loadData();
  }

  protected async loadData() {
    this.isLoading.set(true);
    try {
      const [allPlayers, candidates] = await Promise.all([
        firstValueFrom(this.playersService.getPlayers(this.teamId)),
        firstValueFrom(this.candidatesService.getCandidates(this.teamId))
      ]);
      
      const currentRosterSet = new Set(this.currentRosterPlayerIds);
      
      // Filter out players already on current season roster
      this.historicalPlayers.set(
        allPlayers
          .filter(p => !currentRosterSet.has(p.id))
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
      );
      
      // Candidates who haven't been accepted yet
      this.availableCandidates.set(
        candidates
          .filter(c => c.status !== 'accepted')
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onSegmentChange(event: any) {
    const val = event.detail.value as 'historical' | 'candidates';
    if (val) {
      this.activeSegment.set(val);
    }
  }

  protected togglePlayer(playerId: string) {
    this.selectedPlayerIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(playerId)) newSet.delete(playerId);
      else newSet.add(playerId);
      return newSet;
    });
  }

  protected toggleCandidate(candidateId: string) {
    this.selectedCandidateIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(candidateId)) newSet.delete(candidateId);
      else newSet.add(candidateId);
      return newSet;
    });
  }

  protected dismiss() {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  protected async confirm() {
    const playersToPromote = this.historicalPlayers().filter(p => this.selectedPlayerIds().has(p.id));
    const candidatesToPromote = this.availableCandidates().filter(c => this.selectedCandidateIds().has(c.id));
    
    void this.modalCtrl.dismiss({
      players: playersToPromote,
      candidates: candidatesToPromote
    }, 'confirm');
  }
}
