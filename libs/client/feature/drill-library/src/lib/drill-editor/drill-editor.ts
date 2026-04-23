import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonListHeader,
  IonNote,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, saveOutline } from 'ionicons/icons';
import { DrillService, Tag } from '@apex-team/client/data-access/drill';
import { TagInput } from '@apex-team/client/ui/drill';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-drill-editor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonList,
    IonListHeader,
    IonNote,
    IonBadge,
    TagInput,
  ],
  templateUrl: './drill-editor.html',
  styleUrl: './drill-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillEditor implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly drillService = inject(DrillService);

  protected readonly drillId = signal<string | null>(null);
  protected readonly isEditing = signal(false);
  protected readonly selectedTags = signal<Tag[]>([]);
  protected readonly availableTags = this.drillService.tags;

  protected readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    sourceUrl: [''],
    tags: [[] as string[]],
    instructions: this.fb.array([]),
  });

  get instructions(): FormArray {
    return this.form.get('instructions') as FormArray;
  }

  constructor() {
    addIcons({ addOutline, trashOutline, saveOutline });
  }

  async ngOnInit(): Promise<void> {
    const drillId = this.route.snapshot.params['drillId'];
    this.drillService.getTags().subscribe();

    if (drillId) {
      this.drillId.set(drillId);
      this.isEditing.set(true);
      await this.loadDrill(drillId);
    } else {
      // Add one empty instruction step by default for new drills
      this.addInstruction();
    }
  }

  private async loadDrill(id: string): Promise<void> {
    try {
      const drill = await firstValueFrom(this.drillService.getDrillById(id));
      this.form.patchValue({
        name: drill.name,
        description: drill.description,
        sourceUrl: drill.sourceUrl,
        tags: drill.tags.map(t => t.name),
      });

      this.selectedTags.set(drill.tags);

      // Load instructions
      if (drill.instructions && Array.isArray(drill.instructions)) {
        drill.instructions.forEach((step: any) => {
          this.addInstruction(step.title, step.description);
        });
      } else {
        this.addInstruction();
      }
    } catch (error) {
      console.error('Error loading drill:', error);
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  protected addInstruction(title = '', description = ''): void {
    const step = this.fb.group({
      title: [title, [Validators.required]],
      description: [description, [Validators.required]],
    });
    this.instructions.push(step);
  }

  protected removeInstruction(index: number): void {
    this.instructions.removeAt(index);
  }

  protected handleTagsChanged(tags: Tag[]): void {
    this.selectedTags.set(tags);
    this.form.get('tags')?.setValue(tags.map((t) => t.name));
    this.form.get('tags')?.markAsDirty();
  }

  protected async handleSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      tagNames: this.form.get('tags')?.value,
      sourceUrl: this.form.get('sourceUrl')?.value || undefined,
    };

    try {
      if (this.isEditing()) {
        await firstValueFrom(this.drillService.updateDrill(this.drillId()!, payload));
      } else {
        await firstValueFrom(this.drillService.createDrill(payload));
      }
      this.router.navigate(['../'], { relativeTo: this.route });
    } catch (error) {
      console.error('Error saving drill:', error);
    }
  }
}

