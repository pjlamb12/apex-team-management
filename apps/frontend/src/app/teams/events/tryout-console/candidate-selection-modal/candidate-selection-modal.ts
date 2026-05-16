import { Component, inject, signal, effect, Input, OnInit } from '@angular/core';
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
  selector: 'app-candidate-selection-modal',
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
  templateUrl: './candidate-selection-modal.html',
})
export class CandidateSelectionModal implements OnInit {
  @Input() teamId!: string;
  @Input() existingCandidateIds: string[] = [];

  private readonly playersService = inject(PlayersService);
  private readonly candidatesService = inject(CandidatesService);
  private readonly modalCtrl = inject(ModalController);

  protected isLoading = signal(false);
  protected activeSegment = signal<'roster' | 'global'>('roster');
  
  protected players = signal<PlayerEntity[]>([]);
  protected globalCandidates = signal<CandidateEntity[]>([]);
  
  protected selectedPlayerIds = signal<Set<string>>(new Set());
  protected selectedCandidateIds = signal<Set<string>>(new Set());

  ngOnInit() {
    void this.loadData();
  }

  protected async loadData() {
    this.isLoading.set(true);
    try {
      const [players, candidates] = await Promise.all([
        firstValueFrom(this.playersService.getPlayers(this.teamId)),
        firstValueFrom(this.candidatesService.getCandidates(this.teamId))
      ]);
      
      this.players.set(players.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      
      // Filter out candidates already in the tryout
      const existingSet = new Set(this.existingCandidateIds);
      this.globalCandidates.set(candidates.filter(c => !existingSet.has(c.id)).sort((a, b) => a.lastName.localeCompare(b.lastName)));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onSegmentChange(event: any) {
    const value = event.detail.value as 'roster' | 'global';
    if (value) {
      this.activeSegment.set(value);
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
    const selectedPlayers = this.players().filter(p => this.selectedPlayerIds().has(p.id));
    const selectedGlobalCandidates = this.globalCandidates().filter(c => this.selectedCandidateIds().has(c.id));
    
    void this.modalCtrl.dismiss({
      players: selectedPlayers,
      candidates: selectedGlobalCandidates
    }, 'confirm');
  }
}
