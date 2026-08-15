import { Component, inject, signal, effect, computed, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router, NavigationEnd } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonSpinner,
  IonText,
  IonBadge,
  IonTextarea,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonToast,
  IonAccordion,
  IonAccordionGroup,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  megaphoneOutline, 
  peopleOutline, 
  starOutline, 
  star, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  timeOutline,
  createOutline,
  saveOutline,
  locationOutline,
  addOutline,
  personAddOutline,
  rocketOutline,
  checkmarkCircle,
  trashOutline,
  pencilOutline,
  checkmarkOutline,
  closeOutline,
  documentTextOutline,
  statsChartOutline,
  settingsOutline,
  flashOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { 
  EventsService, 
  EventEntity, 
  CandidatesService, 
  CandidateEntity, 
  CandidateAttendanceEntity,
  CandidateAttendanceStatus,
  ScoutingService,
  ScoutingRubricEntity,
  CandidateEvaluationEntity,
  CandidateNoteEntity,
  TeamService,
  PlayerEntity
} from '@apex-team/client/data-access/team';
import { SocketService } from '../../../shared/services/socket.service';
import { FormsModule } from '@angular/forms';
import { CandidateSelectionModal } from './candidate-selection-modal/candidate-selection-modal';
import { CandidateModal } from './candidate-modal/candidate-modal';

@Component({
  selector: 'app-tryout-console',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    IonSpinner,
    IonText,
    IonBadge,
    IonTextarea,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonToast,
    IonAccordion,
    IonAccordionGroup,
  ],
  templateUrl: './tryout-console.html',
  styleUrl: './tryout-console.scss',
})
export class TryoutConsole implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  private readonly candidatesService = inject(CandidatesService);
  private readonly scoutingService = inject(ScoutingService);
  private readonly teamService = inject(TeamService);
  private readonly socketService = inject(SocketService);
  private readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);

  protected teamId = this.route.snapshot.params['id'];
  protected eventId = this.route.snapshot.params['eventId'];

  @ViewChild('toastContainer') toastContainerEl?: ElementRef<HTMLDivElement>;

  protected selectedSegment = signal<'summary' | 'attendance' | 'rubrics' | 'stats' | 'evaluations' | 'promotion'>('summary');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected toastMessage = signal<string | null>(null);
  
  protected event = signal<EventEntity | null>(null);
  protected team = signal<any | null>(null);
  protected candidates = signal<CandidateEntity[]>([]);
  protected attendance = signal<Record<string, CandidateAttendanceEntity>>({});
  protected rubrics = signal<ScoutingRubricEntity[]>([]);
  protected events = signal<any[]>([]);
  protected toasts = signal<{
    id: string;
    message: string;
    subMessage?: string;
    category: 'success' | 'error' | 'attempt' | 'info' | 'delete';
    type: string;
    isLeaving?: boolean;
  }[]>([]);

  protected evaluationsMap = signal<Record<string, Record<string, { currentCoachEval?: CandidateEvaluationEntity; otherCoachesEvals: CandidateEvaluationEntity[] }>>>({});
  protected generalNotesMap = signal<Record<string, { currentCoachNote?: CandidateNoteEntity; otherCoachesNotes: CandidateNoteEntity[] }>>({});

  protected overallNotes = signal('');
  protected candidateNotes = signal<Record<string, string>>({});
  protected localRubricNotes: Record<string, Record<string, string>> = {};
  protected localGeneralNotes: Record<string, string> = {};
  protected isEditingGeneralNote: Record<string, boolean> = {};
  
  protected currentUserId = signal<string | null>(null);

  protected selectedPlayerId = signal<string | null>(null);

  protected sortedEvents = computed(() => {
    return [...this.events()]
      .filter((e) => e.status !== 'deleted')
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
  });

  protected candidatesInAttendance = computed(() => {
    return this.candidates().filter(c => {
      const status = this.getAttendanceStatus(c.id);
      return status === 'present' || status === 'tardy';
    });
  });

  protected candidateStats = computed(() => {
    const rawEvents = this.events().filter((e) => e.status !== 'deleted');
    const stats: Record<
      string,
      {
        kills: number;
        hits: number;
        hittingErrors: number;
        setAttempts: number;
        setAssists: number;
        setErrors: number;
        passCount: number;
        passScoreSum: number;
        aces: number;
        serviceErrors: number;
        serveAttempts: number;
      }
    > = {};

    rawEvents.forEach((e) => {
      const payload = e.payload || {};
      const pid = e.playerId || payload.playerId || payload.scorerId || payload.assistorId || e.scorerId || e.assistorId;
      if (!pid) return;

      if (!stats[pid]) {
        stats[pid] = {
          kills: 0,
          hits: 0,
          hittingErrors: 0,
          setAttempts: 0,
          setAssists: 0,
          setErrors: 0,
          passCount: 0,
          passScoreSum: 0,
          aces: 0,
          serviceErrors: 0,
          serveAttempts: 0,
        };
      }

      const type = e.eventType || e.type;
      if (type === 'KILL') {
        stats[pid].kills++;
      } else if (type === 'HITTING_ERROR') {
        stats[pid].hittingErrors++;
      } else if (type === 'HIT') {
        stats[pid].hits++;
      } else if (type === 'SET_ATTEMPT') {
        stats[pid].setAttempts++;
      } else if (type === 'SET_ASSIST') {
        stats[pid].setAssists++;
      } else if (type === 'SET_ERROR') {
        stats[pid].setErrors++;
      } else if (type === 'SERVE_RECEIVE') {
        stats[pid].passCount++;
        const score = payload.score ?? e.score ?? 0;
        stats[pid].passScoreSum += score;
      } else if (type === 'SERVE_ATTEMPT') {
        stats[pid].serveAttempts++;
      } else if (type === 'ACE') {
        stats[pid].aces++;
      } else if (type === 'SERVICE_ERROR') {
        stats[pid].serviceErrors++;
      }
    });

    return stats;
  });

  constructor() {
    addIcons({ 
      megaphoneOutline, 
      peopleOutline, 
      starOutline, 
      star, 
      checkmarkCircleOutline, 
      closeCircleOutline, 
      timeOutline,
      createOutline,
      saveOutline,
      locationOutline,
      addOutline,
      personAddOutline,
      rocketOutline,
      checkmarkCircle,
      trashOutline,
      pencilOutline,
      checkmarkOutline,
      closeOutline,
      documentTextOutline,
      statsChartOutline,
      settingsOutline,
      flashOutline,
      informationCircleOutline
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes(`/events/${this.eventId}/tryout`)) {
        void this.loadAllData();
      }
    });
  }

  ngAfterViewInit() {
    if (this.toastContainerEl) {
      const ionApp = document.querySelector('ion-app') || document.body;
      ionApp.appendChild(this.toastContainerEl.nativeElement);
    }
  }

  ngOnInit() {
    void this.loadAllData();

    this.socketService.onEvent('gameEventCreated', (gameEvent: any) => {
      if (gameEvent.eventId === this.eventId) {
        this.events.update((list) => [...list, gameEvent]);
      }
    });

    this.socketService.onEvent('gameEventDeleted', (data: any) => {
      if (data.eventId === this.eventId) {
        this.events.update((list) =>
          list.filter((e) => e.id !== data.id && e.id !== data.gameEventId)
        );
      }
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('gameEventCreated');
    this.socketService.offEvent('gameEventDeleted');

    if (this.toastContainerEl) {
      const el = this.toastContainerEl.nativeElement;
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  protected async loadAllData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [event, attendance, rubrics, team, eventsList] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(this.teamId, this.eventId)),
        firstValueFrom(this.candidatesService.getAttendance(this.teamId, this.eventId)),
        firstValueFrom(this.scoutingService.getRubrics(this.teamId)),
        this.teamService.getTeam(this.teamId),
        firstValueFrom(this.eventsService.getGameEvents(this.teamId, this.eventId))
      ]);

      this.event.set(event);
      this.team.set(team);
      this.events.set(eventsList);
      this.overallNotes.set(event.notes || '');
      this.rubrics.set(rubrics);
      
      const attMap: Record<string, CandidateAttendanceEntity> = {};
      const notesMap: Record<string, string> = {};
      const tryoutCandidates: CandidateEntity[] = [];
      
      attendance.forEach(a => {
        attMap[a.candidateId] = a;
        notesMap[a.candidateId] = a.notes || '';
        if (a.candidate) tryoutCandidates.push(a.candidate);
      });
      
      this.attendance.set(attMap);
      this.candidateNotes.set(notesMap);
      this.candidates.set(tryoutCandidates.sort((a, b) => a.lastName.localeCompare(b.lastName)));

      const userId = this.getUserIdFromToken();
      this.currentUserId.set(userId);

      const evalMap: Record<string, Record<string, { currentCoachEval?: CandidateEvaluationEntity; otherCoachesEvals: CandidateEvaluationEntity[] }>> = {};
      const genNotesMap: Record<string, { currentCoachNote?: CandidateNoteEntity; otherCoachesNotes: CandidateNoteEntity[] }> = {};
      const localRNotes: Record<string, Record<string, string>> = {};
      const localGNotes: Record<string, string> = {};

      await Promise.all(tryoutCandidates.map(async (c) => {
        const evals = await firstValueFrom(this.scoutingService.getEvaluations(this.teamId, c.id));
        const candidateEvals: Record<string, { currentCoachEval?: CandidateEvaluationEntity; otherCoachesEvals: CandidateEvaluationEntity[] }> = {};
        
        localRNotes[c.id] = {};
        rubrics.forEach(r => {
          candidateEvals[r.id] = { otherCoachesEvals: [] };
          localRNotes[c.id][r.id] = '';
        });

        evals.filter(e => e.eventId === this.eventId).forEach(e => {
          if (!candidateEvals[e.rubricId]) {
            candidateEvals[e.rubricId] = { otherCoachesEvals: [] };
          }
          if (e.coachId === userId) {
            candidateEvals[e.rubricId].currentCoachEval = e;
            localRNotes[c.id][e.rubricId] = e.notes || '';
          } else {
            candidateEvals[e.rubricId].otherCoachesEvals.push(e);
          }
        });
        evalMap[c.id] = candidateEvals;

        const notes = await firstValueFrom(this.scoutingService.getCandidateNotes(this.teamId, c.id));
        const sessionNotes = notes.filter(n => n.eventId === this.eventId);
        
        let currentCoachNote: any = undefined;
        const otherCoachesNotes: any[] = [];

        sessionNotes.forEach(n => {
          if (n.coachId === userId) {
            currentCoachNote = n;
          } else {
            otherCoachesNotes.push(n);
          }
        });

        genNotesMap[c.id] = { currentCoachNote, otherCoachesNotes };
        localGNotes[c.id] = currentCoachNote?.content || '';
      }));

      this.evaluationsMap.set(evalMap);
      this.generalNotesMap.set(genNotesMap);
      this.localRubricNotes = localRNotes;
      this.localGeneralNotes = localGNotes;

    } catch (err) {
      console.error('Failed to load tryout data', err);
      this.errorMessage.set('Failed to load tryout data. Please refresh.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onSegmentChange(event: any) {
    this.selectedSegment.set(event.detail.value);
  }

  protected async updateOverallNotes() {
    if (!this.event()) return;
    try {
      await firstValueFrom(this.eventsService.updateEvent(this.teamId, this.eventId, { notes: this.overallNotes() }));
    } catch {
      console.error('Failed to update overall notes');
    }
  }

  protected async markAttendance(candidateId: string, status: CandidateAttendanceStatus) {
    try {
      const notes = this.candidateNotes()[candidateId];
      const updated = await firstValueFrom(this.candidatesService.markAttendance(this.teamId, candidateId, this.eventId, status, notes));
      this.attendance.update(prev => ({ ...prev, [candidateId]: updated }));
    } catch {
      console.error('Failed to mark attendance');
    }
  }

  protected async updateCandidateNote(candidateId: string) {
    const status = this.attendance()[candidateId]?.status || 'present';
    const notes = this.candidateNotes()[candidateId];
    try {
      const updated = await firstValueFrom(this.candidatesService.markAttendance(this.teamId, candidateId, this.eventId, status, notes));
      this.attendance.update(prev => ({ ...prev, [candidateId]: updated }));
    } catch {
      console.error('Failed to update candidate note');
    }
  }

  protected async recordEvaluation(candidateId: string, rubricId: string, rating: number, notes?: string) {
    try {
      const currentEval = this.evaluationsMap()[candidateId]?.[rubricId]?.currentCoachEval;
      const data: Partial<CandidateEvaluationEntity> = {
        candidateId,
        rubricId,
        rating,
        eventId: this.eventId,
        notes: notes !== undefined ? notes : (currentEval?.notes || undefined)
      };

      const saved = await firstValueFrom(this.scoutingService.recordEvaluation(this.teamId, data));
      
      this.evaluationsMap.update(prev => {
        const candidateEvals = prev[candidateId] || {};
        const rubricEvals = candidateEvals[rubricId] || { otherCoachesEvals: [] };
        return {
          ...prev,
          [candidateId]: {
            ...candidateEvals,
            [rubricId]: {
              ...rubricEvals,
              currentCoachEval: saved
            }
          }
        };
      });
    } catch {
      console.error('Failed to record evaluation');
    }
  }

  protected async saveRubricNote(candidateId: string, rubricId: string) {
    const notes = this.localRubricNotes[candidateId]?.[rubricId] || '';
    const currentEval = this.evaluationsMap()[candidateId]?.[rubricId]?.currentCoachEval;
    const rating = currentEval?.rating || 1;
    try {
      await this.recordEvaluation(candidateId, rubricId, rating, notes);
      this.toastMessage.set('Rubric note saved');
    } catch {
      this.errorMessage.set('Failed to save rubric note');
    }
  }

  protected async deleteRubricNote(candidateId: string, rubricId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Rubric Note?',
      message: 'Are you sure you want to remove your note for this category?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: async () => {
            try {
              const currentEval = this.evaluationsMap()[candidateId]?.[rubricId]?.currentCoachEval;
              const rating = currentEval?.rating || 1;
              await this.recordEvaluation(candidateId, rubricId, rating, '');
              this.localRubricNotes[candidateId][rubricId] = '';
              this.toastMessage.set('Rubric note deleted');
            } catch {
              this.errorMessage.set('Failed to delete rubric note');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  protected editGeneralNote(candidateId: string) {
    this.isEditingGeneralNote[candidateId] = true;
  }

  protected async saveGeneralNote(candidateId: string) {
    const content = this.localGeneralNotes[candidateId];
    if (!content || !content.trim()) return;
    try {
      const saved = await firstValueFrom(this.scoutingService.recordCandidateNote(this.teamId, candidateId, {
        eventId: this.eventId,
        content
      }));

      this.generalNotesMap.update(prev => {
        const entry = prev[candidateId] || { otherCoachesNotes: [] };
        return {
          ...prev,
          [candidateId]: {
            ...entry,
            currentCoachNote: saved
          }
        };
      });
      this.isEditingGeneralNote[candidateId] = false;
      this.toastMessage.set('Note saved');
    } catch {
      this.errorMessage.set('Failed to save note');
    }
  }

  protected async deleteGeneralNote(candidateId: string, noteId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Note?',
      message: 'Are you sure you want to remove your overall evaluation note for this candidate?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: async () => {
            try {
              await firstValueFrom(this.scoutingService.deleteCandidateNote(this.teamId, noteId));
              this.generalNotesMap.update(prev => {
                const entry = prev[candidateId] || { otherCoachesNotes: [] };
                return {
                  ...prev,
                  [candidateId]: {
                    ...entry,
                    currentCoachNote: undefined
                  }
                };
              });
              this.localGeneralNotes[candidateId] = '';
              this.isEditingGeneralNote[candidateId] = false;
              this.toastMessage.set('Note deleted');
            } catch {
              this.errorMessage.set('Failed to delete note');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  protected async addRubric(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Add Scouting Rubric',
      message: 'Enter a name for the evaluation category (e.g. Technical Skills)',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Rubric Name' }],
      buttons: [
        'Cancel',
        {
          text: 'Add',
          handler: async (data) => {
            if (!data.name) return;
            try {
              const rubric = await firstValueFrom(this.scoutingService.addRubric(this.teamId, { name: data.name }));
              this.rubrics.update(list => [...list, rubric]);
              this.toastMessage.set('Rubric added');
            } catch {
              this.errorMessage.set('Failed to add rubric');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  protected async deleteRubric(id: string): Promise<void> {
    try {
      await firstValueFrom(this.scoutingService.deleteRubric(this.teamId, id));
      this.rubrics.update(list => list.filter(r => r.id !== id));
      this.toastMessage.set('Rubric removed');
    } catch {
      this.errorMessage.set('Failed to delete rubric');
    }
  }

  protected selectPlayer(playerId: string) {
    this.selectedPlayerId.set(this.selectedPlayerId() === playerId ? null : playerId);
  }

  private getCategory(type: string, score?: number): 'success' | 'error' | 'attempt' | 'info' | 'delete' {
    if (type === 'SERVE_RECEIVE' && score !== undefined) {
      if (score >= 2) return 'success';
      if (score === 1) return 'attempt';
      return 'error';
    }
    
    switch (type) {
      case 'KILL':
      case 'ACE':
      case 'SET_ASSIST':
        return 'success';
      case 'HITTING_ERROR':
      case 'SERVICE_ERROR':
      case 'SET_ERROR':
        return 'error';
      case 'HIT':
      case 'SERVE_ATTEMPT':
      case 'SET_ATTEMPT':
        return 'attempt';
      default:
        return 'info';
    }
  }

  private async triggerVibration(category: 'success' | 'error' | 'attempt' | 'info' | 'delete') {
    try {
      switch (category) {
        case 'success':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'error':
          await Haptics.vibrate({ duration: 150 });
          break;
        case 'attempt':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'delete':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } catch {
      if (navigator.vibrate) {
        try {
          switch (category) {
            case 'success':
              navigator.vibrate(80);
              break;
            case 'error':
              navigator.vibrate([100, 50, 100]);
              break;
            case 'delete':
              navigator.vibrate(150);
              break;
            default:
              navigator.vibrate(40);
              break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  protected showToast(message: string, subMessage: string, category: 'success' | 'error' | 'attempt' | 'info' | 'delete', type: string) {
    const id = Math.random().toString(36).substring(2, 9);
    
    this.toasts.update((current) => {
      const next = [...current, { id, message, subMessage, category, type }];
      if (next.length > 3) {
        next[0].isLeaving = true;
      }
      return next;
    });

    setTimeout(() => {
      this.dismissToast(id);
    }, 2800);
  }

  protected dismissToast(id: string) {
    this.toasts.update((current) =>
      current.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
    );
    setTimeout(() => {
      this.toasts.update((current) => current.filter((t) => t.id !== id));
    }, 250);
  }

  protected async logAction(type: string, payloadExtra: Record<string, any> = {}) {
    const playerId = this.selectedPlayerId();
    if (!playerId) return;

    let payload: Record<string, any> = { playerId };
    if (type === 'KILL' || type === 'ACE') {
      payload = { scorerId: playerId };
    }
    payload = { ...payload, ...payloadExtra };

    try {
      const created = await firstValueFrom(
        this.eventsService.logGameEvent(this.teamId, this.eventId, {
          eventType: type,
          payload,
        })
      );
      if (!this.events().some((e) => e.id === created.id)) {
        this.events.update((list) => [...list, created]);
      }

      // Generate Toast and Vibration feedback
      const category = this.getCategory(type, payloadExtra['score']);
      const candidateName = this.getCandidateNameById(playerId);
      const actionName = this.getEventLabel(created);
      
      this.showToast(
        candidateName,
        `Logged: ${actionName}`,
        category,
        type
      );
      void this.triggerVibration(category);
    } catch (e) {
      console.error('Failed to log tryout action:', e);
    }
  }

  protected async deletePracticeEvent(gameEventId: string): Promise<void> {
    const eventToDelete = this.events().find((e) => e.id === gameEventId);
    try {
      await firstValueFrom(
        this.eventsService.deleteGameEvent(this.teamId, this.eventId, gameEventId)
      );
      this.events.update((list) => list.filter((e) => e.id !== gameEventId));

      if (eventToDelete) {
        const type = eventToDelete.eventType || eventToDelete.type;
        const playerId = eventToDelete.playerId || eventToDelete.payload?.playerId || eventToDelete.payload?.scorerId || eventToDelete.scorerId;
        const candidateName = this.getCandidateNameById(playerId);
        const actionLabel = this.getEventLabel(eventToDelete);
        
        this.showToast(
          `Undone / Deleted`,
          `${candidateName} - ${actionLabel}`,
          'delete',
          type
        );
        void this.triggerVibration('delete');
      }
    } catch (e) {
      console.error('Failed to delete tryout event:', e);
    }
  }

  protected getHittingPct(kills = 0, hittingErrors = 0, hits = 0): string {
    const total = kills + hittingErrors + hits;
    if (total === 0) return '.000';
    const pct = (kills - hittingErrors) / total;
    if (pct < 0) {
      return pct.toFixed(3);
    }
    const fixed = pct.toFixed(3);
    return fixed.startsWith('0') ? fixed.substring(1) : fixed;
  }

  protected getPassAverage(passCount = 0, passScoreSum = 0): string {
    if (passCount === 0) return '-';
    return (passScoreSum / passCount).toFixed(2);
  }

  protected getCandidateShortName(candidate: CandidateEntity): string {
    const firstInitial = candidate.firstName ? `${candidate.firstName.charAt(0)}.` : '';
    const jersey = candidate.tryoutJerseyNumber !== null && candidate.tryoutJerseyNumber !== undefined ? `#${candidate.tryoutJerseyNumber} ` : '';
    return `${jersey}${candidate.lastName}, ${firstInitial}`;
  }

  protected getCandidateNameById(candidateId: string | null | undefined): string {
    if (!candidateId) return 'Unknown Player';
    const candidate = this.candidates().find((c) => c.id === candidateId);
    if (!candidate) return 'Unknown Player';
    return this.getCandidateShortName(candidate);
  }

  protected getEventLabel(e: any): string {
    const type = e.eventType || e.type;
    const payload = e.payload || {};
    switch (type) {
      case 'KILL':
        return 'Kill';
      case 'HIT':
        return 'Hitting Attempt';
      case 'HITTING_ERROR':
        return 'Hitting Error';
      case 'SET_ATTEMPT':
        return 'Setting Attempt';
      case 'SET_ASSIST':
        return 'Setting Assist';
      case 'SET_ERROR':
        return 'Setting Error';
      case 'SERVE_RECEIVE':
        return `Pass (Score: ${payload.score ?? e.score ?? 0})`;
      case 'SERVE_ATTEMPT':
        return 'Serve Attempt';
      case 'ACE':
        return 'Ace';
      case 'SERVICE_ERROR':
        return 'Service Error';
      default:
        return type || 'Action';
    }
  }

  protected getAttendanceStatus(candidateId: string): CandidateAttendanceStatus | 'unmarked' {
    return this.attendance()[candidateId]?.status || 'unmarked';
  }

  protected async openSelectionModal() {
    const modal = await this.modalCtrl.create({
      component: CandidateSelectionModal,
      componentProps: {
        teamId: this.teamId,
        existingCandidateIds: this.candidates().map(c => c.id)
      }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this.isLoading.set(true);
      try {
        const { players, candidates } = data as { players: PlayerEntity[], candidates: CandidateEntity[] };
        
        for (const candidate of candidates) {
          await firstValueFrom(this.candidatesService.markAttendance(this.teamId, candidate.id, this.eventId, 'present'));
        }

        if (players.length > 0) {
          const allCandidates = await firstValueFrom(this.candidatesService.getCandidates(this.teamId));
          
          for (const player of players) {
            let candidate = allCandidates.find(c => 
              (c.parentEmail && player.parentEmail && c.parentEmail === player.parentEmail) ||
              (c.firstName.toLowerCase() === player.firstName.toLowerCase() && c.lastName.toLowerCase() === player.lastName.toLowerCase())
            );
            
            if (!candidate) {
               candidate = await firstValueFrom(this.candidatesService.addCandidate(this.teamId, {
                 firstName: player.firstName,
                 lastName: player.lastName,
                 parentEmail: player.parentEmail || '',
                 preferredPosition: player.preferredPosition || '',
                 tryoutJerseyNumber: player.jerseyNumber || 0,
                 status: 'interested'
               }));
            }
            
            await firstValueFrom(this.candidatesService.markAttendance(this.teamId, candidate.id, this.eventId, 'present'));
          }
        }

        await this.loadAllData();
      } catch (err) {
        console.error('Failed to import players', err);
        this.errorMessage.set('Failed to import one or more players.');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  protected async openNewCandidateModal() {
    const modal = await this.modalCtrl.create({
      component: CandidateModal,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<Partial<CandidateEntity>>();
    if (role === 'confirm' && data) {
      const candidate = await firstValueFrom(this.candidatesService.addCandidate(this.teamId, data));
      await this.markAttendance(candidate.id, 'present');
      await this.loadAllData();
    }
  }

  protected async promoteCandidate(candidate: CandidateEntity) {
    const alert = await this.alertCtrl.create({
      header: 'Promote to Roster?',
      message: `Do you want to add ${candidate.firstName} ${candidate.lastName} to the active roster?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Promote',
          handler: async () => {
            try {
              await firstValueFrom(this.candidatesService.promoteCandidate(this.teamId, candidate.id));
              this.toastMessage.set(`${candidate.firstName} added to roster!`);
              await this.loadAllData();
            } catch {
              this.errorMessage.set('Failed to promote candidate.');
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
