import { Component, inject, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, 
  IonButton, IonIcon, IonSelect, IonSelectOption, IonBadge, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline, trashOutline, addOutline, footballOutline, shieldOutline, arrowBackOutline } from 'ionicons/icons';
import { LiveGameStateService } from '../live-game-state.service';
import { Player } from '@apex-team/shared/util/models';
import { EventsService } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-shootout-scorecard',
  standalone: true,
  imports: [
    CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, 
    IonButton, IonIcon, IonSelect, IonSelectOption, IonBadge, IonGrid, IonRow, IonCol
  ],
  templateUrl: './shootout-scorecard.html',
  styleUrls: ['./shootout-scorecard.scss']
})
export class ShootoutScorecardComponent {
  protected stateService = inject(LiveGameStateService);
  protected eventsService = inject(EventsService);
  
  close = output<void>();

  protected customMaxRound = signal<number>(5);

  protected selectedPlayers = signal<Record<number, string>>({});
  protected selectedGoalkeepers = signal<Record<number, string>>({});

  // Roster players for shooter selection
  protected players = computed(() => {
    return this.stateService.initialLineup().map(e => e.player);
  });

  // Roster players who are goalkeepers, or fallback to all players if none
  protected goalkeepers = computed(() => {
    const gkList = this.stateService.initialLineup()
      .filter(e => e.player.preferredPosition === 'Goalkeeper' || e.slotIndex === 0)
      .map(e => e.player);
    return gkList.length > 0 ? gkList : this.players();
  });

  protected shootoutEvents = computed(() => {
    return this.stateService.events().filter(e => e.type === 'SHOOTOUT_KICK' && e.status !== 'deleted');
  });

  protected score = computed(() => {
    const events = this.shootoutEvents();
    const team = events.filter(e => e['payload']?.team === 'team' && e['payload']?.outcome === 'goal').length;
    const opponent = events.filter(e => e['payload']?.team === 'opponent' && e['payload']?.outcome === 'goal').length;
    return { team, opponent };
  });

  protected rounds = computed(() => {
    const events = this.shootoutEvents();
    const roundsMap = new Map<number, { round: number; teamKick: any; opponentKick: any }>();

    let maxRound = Math.max(5, this.customMaxRound());
    events.forEach(e => {
      const r = (e['payload']?.round as number) || 1;
      if (r > maxRound) maxRound = r;
    });

    for (let r = 1; r <= maxRound; r++) {
      roundsMap.set(r, { round: r, teamKick: null, opponentKick: null });
    }

    events.forEach(e => {
      const round = (e['payload']?.round as number) || 1;
      const r = roundsMap.get(round);
      if (r) {
        if (e['payload']?.team === 'team') {
          r.teamKick = e;
        } else {
          r.opponentKick = e;
        }
      }
    });

    return Array.from(roundsMap.values()).sort((a, b) => a.round - b.round);
  });

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, trashOutline, addOutline, footballOutline, shieldOutline, arrowBackOutline });
  }

  protected getPlayerName(playerId: string): string {
    const p = this.players().find(pl => pl.id === playerId);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown Player';
  }

  protected getGoalkeeperName(playerId: string): string {
    const p = this.goalkeepers().find(pl => pl.id === playerId);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown Keeper';
  }

  protected addRound(): void {
    const currentRounds = this.rounds();
    this.customMaxRound.set(currentRounds.length + 1);
  }

  protected onPlayerChange(round: number, event: any): void {
    const value = event.detail.value;
    this.selectedPlayers.update(val => ({ ...val, [round]: value }));
  }

  protected onGoalkeeperChange(round: number, event: any): void {
    const value = event.detail.value;
    this.selectedGoalkeepers.update(val => ({ ...val, [round]: value }));
  }

  protected logKick(round: number, team: 'team' | 'opponent', outcome: 'goal' | 'miss' | 'save'): void {
    const playerId = team === 'team' ? this.selectedPlayers()[round] : undefined;
    const goalkeeperId = team === 'opponent' ? this.selectedGoalkeepers()[round] : undefined;

    const payload: any = {
      round,
      team,
      outcome
    };

    if (team === 'team' && playerId) {
      payload.playerId = playerId;
    }
    if (team === 'opponent' && goalkeeperId) {
      payload.goalkeeperId = goalkeeperId;
    }

    this.stateService.pushEvent({
      type: 'SHOOTOUT_KICK',
      timestamp: Date.now(),
      minuteOccurred: 0,
      payload
    });
  }

  protected deleteKick(event: any): void {
    if (event.id) {
      this.stateService.setEvents(
        this.stateService.events().map(e => e.id === event.id ? { ...e, status: 'deleted', synced: false } : e)
      );
    } else {
      this.stateService.setEvents(
        this.stateService.events().filter(e => e.timestamp !== event.timestamp)
      );
    }
  }
}
