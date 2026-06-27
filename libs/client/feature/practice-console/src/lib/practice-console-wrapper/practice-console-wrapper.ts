import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, addOutline } from 'ionicons/icons';
import {
  PracticeDrillsService,
  PracticeDrill,
  PracticePacerService,
} from '@apex-team/client/data-access/drill';
import { EventsService, EventEntity } from '@apex-team/client/data-access/team';

import { PracticePlanTab } from '../practice-plan-tab/practice-plan-tab';
import { PracticeExecutionTab } from '../practice-execution-tab/practice-execution-tab';

import { AttendanceList, CoachingNotes } from '@apex-team/client/ui/attendance';


@Component({
  selector: 'app-practice-console-wrapper',
  standalone: true,
  imports: [
    CommonModule,
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
    IonFab,
    IonFabButton,
    PracticePlanTab,
    PracticeExecutionTab,
    AttendanceList,
    CoachingNotes,
  ],
  templateUrl: './practice-console-wrapper.html',
  styleUrl: './practice-console-wrapper.scss',
})
export class PracticeConsoleWrapper implements OnInit {
  @ViewChild(PracticePlanTab) planTab?: PracticePlanTab;

  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  private readonly practiceDrillsService = inject(PracticeDrillsService);
  private readonly pacerService = inject(PracticePacerService);

  protected teamId = this.route.snapshot.params['id'];
  protected eventId = this.route.snapshot.params['eventId'];

  protected selectedSegment = signal<'summary' | 'plan' | 'execution' | 'attendance' | 'notes'>('summary');
  
  private _event = signal<EventEntity | null>(null);
  protected event = this._event.asReadonly();

  private _plan = signal<PracticeDrill[]>([]);
  protected plan = this._plan.asReadonly();

  constructor() {
    addIcons({ pencilOutline, addOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  protected loadData() {
    this.eventsService.getEvent(this.teamId, this.eventId).subscribe((event) => {
      this._event.set(event);
    });

    this.practiceDrillsService.getPlan(this.teamId, this.eventId).subscribe((plan) => {
      this._plan.set(plan);
      this.pacerService.initialize(this.eventId, plan);
    });
  }

  protected onSegmentChange(event: any) {
    this.selectedSegment.set(event.detail.value);
  }

  protected addDrills() {
    this.planTab?.addDrills();
  }
}
