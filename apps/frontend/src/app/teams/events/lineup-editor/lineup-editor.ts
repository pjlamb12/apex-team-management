import { Component, inject, signal, effect, computed, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonListHeader,
  IonNote,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonToast,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, refreshOutline } from 'ionicons/icons';
import {
  EventsService,
  EventEntity,
  LineupEntry,
  SaveLineupDto,
  PlayersService,
  PlayerEntity,
  AttendanceService,
  AttendanceRecord,
  TeamService,
  OpponentsService,
} from '@apex-team/client/data-access/team';
import { SoccerPitchViewComponent, VolleyballCourtViewComponent } from '@apex-team/client/feature/game-console';
import { Player, OpponentWithStats, ThreatLevel } from '@apex-team/shared/util/models';
import { AttendanceList, CoachingNotes } from '@apex-team/client/ui/attendance';

interface LineupSlot {
  slotIndex: number;
  positionName: string | null;
  playerId: string | null;
}

function getDefaultSlots(count: number, sportName?: string): number[] {
  if (sportName === 'Volleyball') return [0, 1, 2, 3, 4, 5];
  if (count === 11) return [0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 14]; // GK, 4 DEF, 4 MID, 2 FWD
  if (count === 9) return [0, 2, 3, 4, 7, 8, 9, 12, 14]; // GK, 3 DEF, 3 MID, 2 FWD
  if (count === 7) return [0, 2, 4, 7, 8, 9, 13]; // GK, 2 DEF, 3 MID, 1 FWD
  if (count === 5) return [0, 2, 4, 8, 13]; // GK, 2 DEF, 1 MID, 1 FWD
  return Array.from({length: count}, (_, i) => i);
}

function getPositionFromSlot(slot: number, sportName?: string, positionTypes?: string[]): string {
  if (sportName === 'Volleyball') {
    if (slot === 99) return 'Libero';
    const defaults = [
      'Opposite Hitter', // Slot 0 / Zone 1
      'Outside Hitter',  // Slot 1 / Zone 2
      'Middle Blocker',  // Slot 2 / Zone 3
      'Opposite Hitter', // Slot 3 / Zone 4
      'Outside Hitter',  // Slot 4 / Zone 5
      'Middle Blocker',  // Slot 5 / Zone 6
    ];
    return defaults[slot] || 'Outside Hitter';
  }
  if (slot === 0) return 'GK';
  if (slot >= 1 && slot <= 5) return 'DEF';
  if (slot >= 6 && slot <= 10) return 'MID';
  if (slot >= 11 && slot <= 15) return 'FWD';
  return 'UNKNOWN';
}

@Component({
  selector: 'app-lineup-editor',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonListHeader,
    IonNote,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonToast,
    SoccerPitchViewComponent,
    VolleyballCourtViewComponent,
    AttendanceList,
    CoachingNotes,
  ],
  templateUrl: './lineup-editor.html',
  styleUrl: './lineup-editor.scss',
})
export class LineupEditor implements OnInit {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  private _eventId = signal<string | null>(null);

  public get teamId(): string {
    return this._teamId() ?? '';
  }

  @Input() set eventId(val: string) {
    this._eventId.set(val);
  }

  public get eventId(): string {
    return this._eventId() ?? '';
  }

  private readonly eventsService = inject(EventsService);
  private readonly playersService = inject(PlayersService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly teamService = inject(TeamService);
  private readonly opponentsService = inject(OpponentsService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);

  protected event = signal<EventEntity | null>(null);
  protected team = signal<any | null>(null);
  protected players = signal<PlayerEntity[]>([]);
  protected attendance = signal<AttendanceRecord[]>([]);
  protected slots = signal<LineupSlot[]>([]);
  protected opponentDossier = signal<OpponentWithStats | null>(null);
  protected showOpponentIntel = signal(false);
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected viewMode = signal<'list' | 'pitch' | 'attendance' | 'notes'>('list');
  protected selectedPlayerId = signal<string | null>(null);
  protected toastMessage = signal<string | null>(null);

  protected liberoId = computed(() => {
    const liberoSlot = this.slots().find((s) => s.slotIndex === 99);
    return liberoSlot?.playerId || null;
  });
  protected liberoDesignation = computed(() => {
    const lId = this.liberoId();
    if (!lId) return null;
    return { liberoId: lId, replacedId: '' };
  });

  protected toggleOpponentIntel(): void {
    this.showOpponentIntel.update((v) => !v);
  }

  protected getThreatBadgeClass(threatLevel?: ThreatLevel | null): string {
    switch (threatLevel) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  }

  protected setLiberoId(playerId: string | null): void {
    this.slots.update((prev) => {
      const exists = prev.some((s) => s.slotIndex === 99);
      if (exists) {
        return prev.map((s) => {
          if (s.slotIndex === 99) {
            return { ...s, playerId };
          }
          return s;
        });
      } else {
        return [...prev, { slotIndex: 99, positionName: 'Libero', playerId }];
      }
    });
  }

  protected setViewMode(mode: any): void {
    this.viewMode.set(mode);
  }

  protected positionOptions = computed(() => {
    const teamObj = this.team();
    if (teamObj?.sport?.name === 'Volleyball') {
      return teamObj.sport.positionTypes || ['Setter', 'Outside Hitter', 'Opposite Hitter', 'Middle Blocker', 'Libero', 'Defensive Specialist'];
    }
    return ['GK', 'DEF', 'MID', 'FWD'];
  });

  protected assignedPlayerIds = computed(() => {
    return new Set(
      this.slots()
        .map((s) => s.playerId)
        .filter((id): id is string => !!id)
    );
  });

  protected absentPlayerIds = computed(() => {
    return new Set(
      this.attendance()
        .filter((a) => a.status === 'absent')
        .map((a) => a.playerId)
    );
  });

  protected benchPlayers = computed(() => {
    const assigned = this.assignedPlayerIds();
    const absent = this.absentPlayerIds();
    return this.players().filter((p) => !assigned.has(p.id) && !absent.has(p.id) && p.isActive !== false);
  });

  protected eligibleLiberos = computed(() => {
    const startingIds = new Set(
      this.slots()
        .filter((s) => s.slotIndex !== 99 && !!s.playerId)
        .map((s) => s.playerId!)
    );
    const absent = this.absentPlayerIds();
    return this.players().filter((p) => !startingIds.has(p.id) && !absent.has(p.id) && p.isActive !== false);
  });

  protected pitchPlayers = computed(() => {
    const players = this.players();
    return this.slots()
      .filter((s) => !!s.playerId)
      .map((s) => {
        const p = players.find((p) => p.id === s.playerId);
        if (!p) return null;
        return {
          ...p,
          slotIndex: s.slotIndex,
          preferredPosition: s.positionName || undefined,
        } as Player & { slotIndex: number };
      })
      .filter((p): p is Player & { slotIndex: number } => p !== null);
  });

  constructor() {
    addIcons({ settingsOutline, refreshOutline });
    // Load data whenever teamId or eventId changes
    effect(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        void this.loadData(tId, eId);
      }
    });
  }

  ngOnInit(): void {
    const tId = this.teamId;
    const eId = this.eventId;
    if (tId && eId) {
      void this.loadData(tId, eId);
    }
  }

  private async loadData(teamId: string, eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const event = await firstValueFrom(this.eventsService.getEvent(teamId, eventId));
      const playersReq = event.seasonId 
        ? this.playersService.getPlayersForSeason(teamId, event.seasonId) 
        : this.playersService.getPlayers(teamId);

      const [players, lineup, attendance, team, gameEvents] = await Promise.all([
        firstValueFrom(playersReq),
        firstValueFrom(this.eventsService.getLineup(teamId, eventId)),
        firstValueFrom(this.attendanceService.getAttendance(teamId, eventId)),
        this.teamService.getTeam(teamId),
        firstValueFrom(this.eventsService.getGameEvents(teamId, eventId)),
      ]);

      this.event.set(event);
      this.attendance.set(attendance);
      this.team.set(team);

      // Load Opponent Dossier if available
      if (event.opponentId) {
        try {
          const opp = await firstValueFrom(this.opponentsService.getOpponent(teamId, event.opponentId));
          this.opponentDossier.set(opp);
        } catch (e) {
          console.warn('Failed to load opponent dossier', e);
        }
      } else if (event.opponent) {
        try {
          const opps = await firstValueFrom(this.opponentsService.getOpponents(teamId, event.opponent.trim()));
          const found = opps.find((o) => o.name.toLowerCase() === event.opponent!.trim().toLowerCase());
          if (found) {
            const opp = await firstValueFrom(this.opponentsService.getOpponent(teamId, found.id));
            this.opponentDossier.set(opp);
          }
        } catch (e) {
          console.warn('Failed to load opponent dossier', e);
        }
      }

      let leagueGuests: PlayerEntity[] = [];
      if (event.leagueId) {
        try {
          leagueGuests = await firstValueFrom(this.playersService.getGuestPlayersForLeague(teamId, event.leagueId));
        } catch (e) {
          console.error('Failed to load league guest players', e);
        }
      }

      // Merge players from the lineup and competition guest players into the players list
      const allPlayersMap = new Map<string, PlayerEntity>();
      players.forEach((p) => allPlayersMap.set(p.id, p));
      leagueGuests.forEach((gp) => allPlayersMap.set(gp.id, gp));
      lineup.forEach((entry) => {
        if (entry.player && !allPlayersMap.has(entry.player.id)) {
          if (entry.player.isActive === false && entry.status !== 'starting') {
            return;
          }
          allPlayersMap.set(entry.player.id, {
            ...entry.player,
            teamId,
          } as any);
        }
      });
      this.players.set(Array.from(allPlayersMap.values()));

      // Extract libero designation if it exists
      const liberoEvent = gameEvents
        .filter((e: any) => e.eventType === 'SUB' && e.payload?.isLiberoDesignation === true)
        .pop();
      const liberoEntry = lineup.find((e) => e.slotIndex === 99);
      const initialLiberoId = liberoEntry?.playerId || (liberoEvent ? (liberoEvent.payload.inPlayerId as string) : null);

      const sportName = team?.sport?.name;
      const positionTypes = team?.sport?.positionTypes || [];
      const fieldCount = event.playersOnField || (sportName === 'Volleyball' ? 6 : 11);
      const defaultSlots = getDefaultSlots(fieldCount, sportName);

      // Filter out absent player IDs
      const absent = new Set(attendance.filter((a) => a.status === 'absent').map((a) => a.playerId));

      // Separate starters from lineup (excluding volleyball libero slot 99)
      const startingLineup = lineup.filter(
        (e) => e.status === 'starting' && e.slotIndex !== 99
      );

      const newSlots: LineupSlot[] = [];
      const usedSlotIndices = new Set<number>();
      const unassignedEntries: typeof startingLineup = [];

      // 1. First add slots for starting entries that already have a valid slotIndex (preserving custom formations)
      for (const entry of startingLineup) {
        if (entry.slotIndex !== null && entry.slotIndex !== undefined && !usedSlotIndices.has(entry.slotIndex)) {
          usedSlotIndices.add(entry.slotIndex);
          const isAbsent = absent.has(entry.playerId);
          newSlots.push({
            slotIndex: entry.slotIndex,
            positionName: entry.positionName || getPositionFromSlot(entry.slotIndex, sportName, positionTypes),
            playerId: isAbsent ? null : entry.playerId,
          });
        } else if (!absent.has(entry.playerId)) {
          unassignedEntries.push(entry);
        }
      }

      // 2. If total on-field slots < fieldCount, add empty slots from defaultSlots that haven't been used yet
      for (const defSlot of defaultSlots) {
        if (newSlots.length >= fieldCount) break;
        if (!usedSlotIndices.has(defSlot)) {
          usedSlotIndices.add(defSlot);
          newSlots.push({
            slotIndex: defSlot,
            positionName: getPositionFromSlot(defSlot, sportName, positionTypes),
            playerId: null,
          });
        }
      }

      // 3. If still below fieldCount, fill in any remaining valid slot indices
      let candidateSlot = 0;
      const maxCandidate = sportName === 'Volleyball' ? 5 : 15;
      while (newSlots.length < fieldCount && candidateSlot <= maxCandidate) {
        if (!usedSlotIndices.has(candidateSlot)) {
          usedSlotIndices.add(candidateSlot);
          newSlots.push({
            slotIndex: candidateSlot,
            positionName: getPositionFromSlot(candidateSlot, sportName, positionTypes),
            playerId: null,
          });
        }
        candidateSlot++;
      }

      // 4. Fill unassigned starting players into empty slots
      for (const entry of unassignedEntries) {
        const emptySlot = newSlots.find((s) => s.playerId === null);
        if (emptySlot) {
          emptySlot.playerId = entry.playerId;
          if (entry.positionName) {
            emptySlot.positionName = entry.positionName;
          }
        }
      }

      // Sort slots by slotIndex for consistent visual order in list view
      newSlots.sort((a, b) => a.slotIndex - b.slotIndex);

      if (sportName === 'Volleyball') {
        newSlots.push({
          slotIndex: 99,
          positionName: 'Libero',
          playerId: initialLiberoId,
        });
      }

      this.slots.set(newSlots);
    } catch (err) {
      console.error('Failed to load lineup data', err);
      this.errorMessage.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onAttendanceChanged(): void {
    const tId = this.teamId;
    const eId = this.eventId;
    if (tId && eId) {
      void this.loadData(tId, eId);
    }
  }

  protected availablePlayers(currentSlotIndex: number): PlayerEntity[] {
    const currentSlotPlayerId = this.slots().find(s => s.slotIndex === currentSlotIndex)?.playerId;
    const otherAssignedIds = new Set(
      this.slots()
        .filter((s) => s.slotIndex !== currentSlotIndex)
        .map((s) => s.playerId)
        .filter((id): id is string => !!id)
    );
    const absent = this.absentPlayerIds();
    return this.players().filter((p) => !otherAssignedIds.has(p.id) && !absent.has(p.id) && (p.isActive !== false || p.id === currentSlotPlayerId));
  }

  protected updateSlot(
    index: number,
    field: keyof LineupSlot,
    value: any
  ): void {
    this.slots.update((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      
      if (field === 'positionName' && this.team()?.sport?.name !== 'Volleyball') {
        const pos = value as string;
        let minSlot = 0, maxSlot = 0;
        if (pos === 'GK') { minSlot = 0; maxSlot = 0; }
        else if (pos === 'DEF') { minSlot = 1; maxSlot = 5; }
        else if (pos === 'MID') { minSlot = 6; maxSlot = 10; }
        else if (pos === 'FWD') { minSlot = 11; maxSlot = 15; }
        
        const currentSlotIndex = next[index].slotIndex;
        if (currentSlotIndex < minSlot || currentSlotIndex > maxSlot) {
          const occupied = new Set(next.map((s, i) => i !== index ? s.slotIndex : -1));
          let newSlot = -1;
          for (let i = minSlot; i <= maxSlot; i++) {
            if (!occupied.has(i)) { newSlot = i; break; }
          }
          if (newSlot !== -1) {
            next[index].slotIndex = newSlot;
          }
        }
      }
      
      return next;
    });
  }

  protected handlePitchPlayerSelected(data: { player: Player; event: Event }): void {
    const { player } = data;
    const currentSelection = this.selectedPlayerId();

    if (!currentSelection) {
      this.selectedPlayerId.set(player.id);
      return;
    }

    if (currentSelection === player.id) {
      this.selectedPlayerId.set(null);
      return;
    }

    // If another player selected, swap slots
    const slots = this.slots();
    const slotAIndex = slots.findIndex(s => s.playerId === currentSelection);
    const slotBIndex = slots.findIndex(s => s.playerId === player.id);

    if (slotAIndex !== -1 && slotBIndex !== -1) {
      const slotAId = slots[slotAIndex].playerId;
      const slotBId = slots[slotBIndex].playerId;

      this.updateSlot(slotAIndex, 'playerId', slotBId);
      this.updateSlot(slotBIndex, 'playerId', slotAId);
    } else if (slotAIndex === -1 && slotBIndex !== -1) {
      // currentSelection is on the bench, clicked player is on the field
      this.updateSlot(slotBIndex, 'playerId', currentSelection);
    } else if (slotBIndex === -1 && slotAIndex !== -1) {
      // player.id is on the bench, currentSelection is on the field
      this.updateSlot(slotAIndex, 'playerId', player.id);
    }

    this.selectedPlayerId.set(null);
  }

  protected handlePitchEmptySlotSelected(targetSlotIndex: number): void {
    const currentSelection = this.selectedPlayerId();
    if (!currentSelection) return;

    if (targetSlotIndex === 99) {
      const isStarting = this.slots().some(s => s.slotIndex !== 99 && s.playerId === currentSelection);
      if (isStarting) return;
    }

    const sportName = this.team()?.sport?.name;
    const positionTypes = this.team()?.sport?.positionTypes || [];
    const newPositionName = getPositionFromSlot(targetSlotIndex, sportName, positionTypes);

    this.slots.update((prev) => {
      const next = prev.map((s) => ({ ...s }));
      const existingSlotIndex = next.findIndex((s) => s.playerId === currentSelection);

      if (existingSlotIndex !== -1) {
        // Selected player is ALREADY on the pitch: moving to targetSlotIndex
        const targetSlot = next.find((s) => s.slotIndex === targetSlotIndex);
        if (targetSlot) {
          if (targetSlot.playerId === null) {
            targetSlot.playerId = currentSelection;
            targetSlot.positionName = newPositionName;
            next[existingSlotIndex].playerId = null;
          } else {
            // Swap players between the two starting slots
            const tempPlayerId = targetSlot.playerId;
            targetSlot.playerId = currentSelection;
            next[existingSlotIndex].playerId = tempPlayerId;
          }
        } else {
          // No slot with targetSlotIndex exists yet. Reassign existing slot to targetSlotIndex and position.
          next[existingSlotIndex].slotIndex = targetSlotIndex;
          next[existingSlotIndex].positionName = newPositionName;
        }
      } else {
        // Selected player is ON THE BENCH: adding to targetSlotIndex
        const targetSlot = next.find((s) => s.slotIndex === targetSlotIndex);
        if (targetSlot) {
          targetSlot.playerId = currentSelection;
          targetSlot.positionName = newPositionName;
        } else {
          // Find an empty starting slot (playerId === null)
          const emptySlot = next.find((s) => s.playerId === null);
          if (emptySlot) {
            emptySlot.slotIndex = targetSlotIndex;
            emptySlot.positionName = newPositionName;
            emptySlot.playerId = currentSelection;
          } else {
            this.toastMessage.set('All starting spots on the field are filled.');
          }
        }
      }

      return next;
    });

    this.selectedPlayerId.set(null);
  }

  protected rotateStartingLineup(): void {
    this.slots.update((prev) => {
      const next = prev.map(s => ({ ...s }));
      const courtSlots = next.filter((s) => s.slotIndex !== 99);
      if (courtSlots.length !== 6) return prev;

      const tempPlayers = courtSlots.map((s) => s.playerId);
      const tempPositions = courtSlots.map((s) => s.positionName);

      courtSlots.forEach((slot, i) => {
        const sourceIndex = (i + 1) % 6;
        slot.playerId = tempPlayers[sourceIndex];
        slot.positionName = tempPositions[sourceIndex];
      });

      return next;
    });
  }

  protected handleBenchPlayerClick(player: PlayerEntity): void {
    const currentSelection = this.selectedPlayerId();
    if (currentSelection === player.id) {
      this.selectedPlayerId.set(null);
    } else if (currentSelection) {
      const slots = this.slots();
      const slotIndex = slots.findIndex(s => s.playerId === currentSelection);
      if (slotIndex !== -1) {
        // Pitch player was selected, clicked bench player to swap them in
        this.updateSlot(slotIndex, 'playerId', player.id);
        this.selectedPlayerId.set(null);
      } else {
        this.selectedPlayerId.set(player.id);
      }
    } else {
      this.selectedPlayerId.set(player.id);
    }
  }

  protected async onSave(goLive = false): Promise<void> {
    const eventId = this.eventId;
    const teamId = this.teamId;
    if (!eventId || !teamId) return;

    this.isSaving.set(true);
    try {
      const dto: SaveLineupDto = {
        entries: [
          // Starters
          ...this.slots()
            .filter((s) => !!s.playerId)
            .map((s) => ({
              playerId: s.playerId!,
              positionName: s.positionName || undefined,
              slotIndex: s.slotIndex,
              status: s.slotIndex === 99 ? ('bench' as const) : ('starting' as const),
            })),
          // Bench
          ...this.benchPlayers().map((p) => ({
            playerId: p.id,
            status: 'bench' as const,
          })),
        ],
      };

      await firstValueFrom(this.eventsService.saveLineup(teamId, eventId, dto));
      
      if (goLive) {
        void this.router.navigate(['/teams', teamId, 'events', eventId, 'console']);
      } else {
        this.toastMessage.set('Lineup saved successfully');
      }
    } catch (err) {
      console.error('Failed to save lineup', err);
      this.errorMessage.set('Failed to save lineup. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async addGuestPlayer(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Add Guest Player',
      inputs: [
        { name: 'firstName', type: 'text', placeholder: 'First Name' },
        { name: 'lastName', type: 'text', placeholder: 'Last Name' },
        { name: 'jerseyNumber', type: 'number', placeholder: 'Jersey Number' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            if (!data.firstName || !data.lastName || !data.jerseyNumber) {
              return false;
            }
            void this.performAddGuestPlayer(data.firstName, data.lastName, +data.jerseyNumber);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async performAddGuestPlayer(firstName: string, lastName: string, jerseyNumber: number): Promise<void> {
    try {
      const leagueId = this.event()?.leagueId || undefined;
      const guest = await firstValueFrom(
        this.playersService.addPlayer(this.teamId, {
          firstName,
          lastName,
          jerseyNumber,
          isGuest: true,
          leagueId,
        })
      );

      // Add the new guest player to the local players list so they can be assigned
      this.players.update((prev) => [...prev, guest]);

      this.toastMessage.set(`Guest player #${jerseyNumber} added to bench.`);
    } catch (err) {
      console.error('Failed to add guest player:', err);
      this.errorMessage.set('Failed to add guest player.');
    }
  }
}
