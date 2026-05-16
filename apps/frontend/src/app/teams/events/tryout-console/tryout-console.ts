import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router, NavigationEnd } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
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
  checkmarkCircle
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
  PlayerEntity
} from '@apex-team/client/data-access/team';
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
  ],
  templateUrl: './tryout-console.html',
})
export class TryoutConsole implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  private readonly candidatesService = inject(CandidatesService);
  private readonly scoutingService = inject(ScoutingService);
  private readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);

  protected teamId = this.route.snapshot.params['id'];
  protected eventId = this.route.snapshot.params['eventId'];

  protected selectedSegment = signal<'summary' | 'attendance' | 'evaluations' | 'promotion'>('summary');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected toastMessage = signal<string | null>(null);
  protected event = signal<EventEntity | null>(null);
  protected candidates = signal<CandidateEntity[]>([]);
  protected attendance = signal<Record<string, CandidateAttendanceEntity>>({});
  protected rubrics = signal<ScoutingRubricEntity[]>([]);
  protected evaluations = signal<Record<string, Record<string, CandidateEvaluationEntity>>>({}); // candidateId -> rubricId -> evaluation

  // Local state for notes editing
  protected overallNotes = signal('');
  protected candidateNotes = signal<Record<string, string>>({}); // event attendance notes

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
      checkmarkCircle
    });

    // Auto-refresh when navigating back from Settings
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes(`/events/${this.eventId}/tryout`)) {
        void this.loadAllData();
      }
    });
  }

  ngOnInit() {
    void this.loadAllData();
  }

  protected async loadAllData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [event, attendance, rubrics] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(this.teamId, this.eventId)),
        firstValueFrom(this.candidatesService.getAttendance(this.teamId, this.eventId)),
        firstValueFrom(this.scoutingService.getRubrics(this.teamId))
      ]);

      this.event.set(event);
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

      // Fetch evaluations for each candidate
      const evalMap: Record<string, Record<string, CandidateEvaluationEntity>> = {};
      await Promise.all(tryoutCandidates.map(async (c) => {
        const evals = await firstValueFrom(this.scoutingService.getEvaluations(this.teamId, c.id));
        const candidateEvals: Record<string, CandidateEvaluationEntity> = {};
        evals.filter(e => e.eventId === this.eventId).forEach(e => {
          candidateEvals[e.rubricId] = e;
        });
        evalMap[c.id] = candidateEvals;
      }));
      this.evaluations.set(evalMap);

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

  protected async recordRating(candidateId: string, rubricId: string, rating: number) {
    try {
      const existingEval = this.evaluations()[candidateId]?.[rubricId];
      const data: Partial<CandidateEvaluationEntity> = {
        candidateId,
        rubricId,
        rating,
        eventId: this.eventId,
        notes: existingEval?.notes || undefined
      };

      const saved = await firstValueFrom(this.scoutingService.recordEvaluation(this.teamId, data));
      
      this.evaluations.update(prev => {
        const candidateEvals = prev[candidateId] || {};
        return {
          ...prev,
          [candidateId]: {
            ...candidateEvals,
            [rubricId]: saved
          }
        };
      });
    } catch {
      console.error('Failed to record rating');
    }
  }

  protected getAttendanceStatus(candidateId: string): CandidateAttendanceStatus | 'unmarked' {
    return this.attendance()[candidateId]?.status || 'unmarked';
  }

  protected getRating(candidateId: string, rubricId: string): number {
    return this.evaluations()[candidateId]?.[rubricId]?.rating || 0;
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
        
        // 1. Process global candidates
        for (const candidate of candidates) {
          await firstValueFrom(this.candidatesService.markAttendance(this.teamId, candidate.id, this.eventId, 'present'));
        }

        // 2. Process roster players
        if (players.length > 0) {
          const allCandidates = await firstValueFrom(this.candidatesService.getCandidates(this.teamId));
          
          for (const player of players) {
            let candidate = allCandidates.find(c => c.parentEmail === (player.parentEmail || ''));
            
            if (!candidate) {
               candidate = await firstValueFrom(this.candidatesService.addCandidate(this.teamId, {
                 firstName: player.firstName,
                 lastName: player.lastName,
                 parentEmail: player.parentEmail || '',
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
