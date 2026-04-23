import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonReorderGroup,
  IonItemSliding,
  IonItem,
  IonReorder,
  IonIcon,
  IonLabel,
  IonButtons,
  IonButton,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  reorderThreeOutline,
  trashOutline,
  timeOutline,
  createOutline,
  warningOutline,
  starOutline,
} from 'ionicons/icons';
import {
  PracticeDrillsService,
  PracticeDrill,
  Drill,
} from '@apex-team/client/data-access/drill';
import { EventEntity } from '@apex-team/client/data-access/team';
import { DrillSelectorModal } from '../drill-selector-modal/drill-selector-modal';

@Component({
  selector: 'app-practice-plan-tab',
  standalone: true,
  imports: [
    CommonModule,
    IonReorderGroup,
    IonItemSliding,
    IonItem,
    IonReorder,
    IonIcon,
    IonLabel,
    IonButtons,
    IonButton,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './practice-plan-tab.html',
  styleUrl: './practice-plan-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticePlanTab {
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  private readonly practiceDrillsService = inject(PracticeDrillsService);

  teamId = input.required<string>();
  eventId = input.required<string>();
  plan = input.required<PracticeDrill[]>();
  event = input.required<EventEntity | null>();

  planChanged = output<void>();

  protected totalDuration = computed(() => {
    return this.plan().reduce((sum, pd) => sum + (pd.durationMinutes || 0), 0);
  });

  protected isOvertime = computed(() => {
    const eventLimit = this.event()?.durationMinutes || 0;
    return this.totalDuration() > eventLimit;
  });

  protected isRatingEnabled = computed(() => {
    const status = this.event()?.status;
    return status === 'in_progress' || status === 'completed';
  });

  constructor() {
    addIcons({
      addOutline,
      reorderThreeOutline,
      trashOutline,
      timeOutline,
      createOutline,
      warningOutline,
      starOutline,
    });
  }

  protected async addDrills() {
    const modal = await this.modalCtrl.create({
      component: DrillSelectorModal,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      const selectedDrills: Drill[] = data;
      // Add each drill one by one (or implementation bulk if API supports it, but our service currently does one by one)
      for (const drill of selectedDrills) {
        await this.practiceDrillsService.addDrill(this.teamId(), this.eventId(), {
          drillId: drill.id,
          durationMinutes: 10, // Default duration
        }).toPromise();
      }
      this.planChanged.emit();
    }
  }

  protected async handleReorder(ev: any) {
    const plan = [...this.plan()];
    const itemToMove = plan.splice(ev.detail.from, 1)[0];
    plan.splice(ev.detail.to, 0, itemToMove);
    
    const ids = plan.map(pd => pd.id);
    
    ev.detail.complete();

    this.practiceDrillsService.reorderDrills(this.teamId(), this.eventId(), ids).subscribe(() => {
      this.planChanged.emit();
    });
  }

  protected async editDrill(pd: PracticeDrill) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Drill',
      inputs: [
        {
          name: 'durationMinutes',
          type: 'number',
          placeholder: 'Duration (min)',
          value: pd.durationMinutes,
          min: 1,
        },
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Notes',
          value: pd.notes || '',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            this.practiceDrillsService.updateDrill(this.teamId(), this.eventId(), pd.id, {
              durationMinutes: parseInt(data.durationMinutes, 10),
              notes: data.notes,
            }).subscribe(() => {
              this.planChanged.emit();
            });
          },
        },
      ],
    });

    await alert.present();
  }

  protected async deleteDrill(pd: PracticeDrill) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Drill',
      message: `Are you sure you want to remove "${pd.drill?.name}" from the plan?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.practiceDrillsService.removeDrill(this.teamId(), this.eventId(), pd.id).subscribe(() => {
              this.planChanged.emit();
            });
          },
        },
      ],
    });

    await alert.present();
  }

  protected setRating(pd: PracticeDrill, rating: number) {
    if (!this.isRatingEnabled()) return;

    this.practiceDrillsService.updateDrill(this.teamId(), this.eventId(), pd.id, {
      teamRating: rating,
    }).subscribe(() => {
      this.planChanged.emit();
    });
  }
}
