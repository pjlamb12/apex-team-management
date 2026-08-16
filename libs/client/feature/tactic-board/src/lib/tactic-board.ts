import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonSpinner,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  easelOutline,
  libraryOutline,
  saveOutline,
  flashOutline,
  refreshOutline,
  trashOutline,
  arrowForwardOutline,
  arrowRedoOutline,
  arrowUndoOutline,
  playOutline,
  pauseOutline,
  addOutline,
  duplicateOutline,
  scanOutline,
  expandOutline,
  contractOutline,
  downloadOutline,
  colorPaletteOutline,
  shareSocialOutline,
  informationCircleOutline,
  footballOutline,
  ellipseOutline,
  closeOutline,
  layersOutline,
  sparklesOutline,
} from 'ionicons/icons';
import {
  TacticSport,
  PitchType,
  TacticToken,
  TacticDrawing,
  TacticPhase,
  TacticCanvasData,
  TacticPlay,
  DrawingToolType,
  CreateTacticPlayDto,
} from '@apex-team/shared/util/models';
import { TacticsService } from '@apex-team/client/data-access/tactics';
import { PitchCanvas } from './components/pitch-canvas/pitch-canvas';
import { PlaybookCard } from './components/playbook-card/playbook-card';
import { SavePlayModal } from './components/save-play-modal/save-play-modal';
import { PresetPickerModal, PresetFormation } from './components/preset-picker-modal/preset-picker-modal';

@Component({
  selector: 'app-tactic-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonSpinner,
    PitchCanvas,
    PlaybookCard,
  ],
  templateUrl: './tactic-board.html',
  styleUrl: './tactic-board.scss',
})
export class TacticBoard implements OnInit {
  readonly tacticsService = inject(TacticsService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  // View state
  readonly viewMode = signal<'board' | 'playbook'>('board');
  readonly isFullscreen = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  // Board canvas state
  readonly currentSport = computed(() => this.tacticsService.selectedSport());
  readonly pitchType = signal<PitchType>('full_pitch');
  readonly tokens = signal<TacticToken[]>([]);
  readonly drawings = signal<TacticDrawing[]>([]);
  readonly phases = signal<TacticPhase[]>([]);
  readonly currentPhaseIndex = signal<number>(0);
  readonly isPlayingAnimation = signal<boolean>(false);

  // Tools & Styling
  readonly activeTool = signal<'select' | DrawingToolType | 'eraser'>('select');
  readonly activeColor = signal<string>('#facc15');
  readonly strokeWidth = signal<number>(3);

  // History stack for Undo/Redo
  private historyStack: { tokens: TacticToken[]; drawings: TacticDrawing[] }[] = [];
  private historyIndex = -1;
  private animationInterval: any = null;

  // Available colors
  readonly colorPalette = [
    { label: 'Yellow', value: '#facc15' },
    { label: 'White', value: '#ffffff' },
    { label: 'Cyan', value: '#38bdf8' },
    { label: 'Green', value: '#4ade80' },
    { label: 'Orange', value: '#fb923c' },
    { label: 'Red', value: '#f87171' },
  ];

  // Category filter for playbook
  readonly playbookCategory = signal<string>('all');
  readonly playbookSearch = signal<string>('');

  constructor() {
    addIcons({
      easelOutline,
      libraryOutline,
      saveOutline,
      flashOutline,
      refreshOutline,
      trashOutline,
      arrowForwardOutline,
      arrowRedoOutline,
      arrowUndoOutline,
      playOutline,
      pauseOutline,
      addOutline,
      duplicateOutline,
      scanOutline,
      expandOutline,
      contractOutline,
      downloadOutline,
      colorPaletteOutline,
      shareSocialOutline,
      informationCircleOutline,
      footballOutline,
      ellipseOutline,
      closeOutline,
      layersOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    // Initial fetch of plays for current sport
    this.tacticsService.loadPlays().subscribe();

    // Default starter board if empty
    this.resetToDefaultPreset(this.currentSport());
  }

  onSportChange(sport: TacticSport): void {
    if (this.currentSport() === sport) return;
    this.tacticsService.setSport(sport);
    this.pitchType.set(sport === 'soccer' ? 'full_pitch' : 'full_court');
    this.resetToDefaultPreset(sport);
  }

  resetToDefaultPreset(sport: TacticSport): void {
    if (sport === 'soccer') {
      this.pitchType.set('full_pitch');
      this.tokens.set([
        { id: '1', label: '1', role: 'GK', team: 'home', x: 8, y: 50 },
        { id: '2', label: '2', role: 'RB', team: 'home', x: 25, y: 85 },
        { id: '3', label: '4', role: 'CB', team: 'home', x: 22, y: 62 },
        { id: '4', label: '5', role: 'CB', team: 'home', x: 22, y: 38 },
        { id: '5', label: '3', role: 'LB', team: 'home', x: 25, y: 15 },
        { id: '6', label: '6', role: 'CDM', team: 'home', x: 38, y: 50 },
        { id: '7', label: '8', role: 'CM', team: 'home', x: 52, y: 68 },
        { id: '8', label: '10', role: 'CAM', team: 'home', x: 52, y: 32 },
        { id: '9', label: '7', role: 'RW', team: 'home', x: 70, y: 82 },
        { id: '10', label: '9', role: 'ST', team: 'home', x: 75, y: 50 },
        { id: '11', label: '11', role: 'LW', team: 'home', x: 70, y: 18 },
        { id: 'ball', label: '', team: 'ball', x: 38, y: 53 },
      ]);
    } else {
      this.pitchType.set('full_court');
      this.tokens.set([
        { id: 'v1', label: 'S', role: 'Setter', team: 'home', x: 38, y: 78 },
        { id: 'v2', label: 'OH1', role: 'Outside 1', team: 'home', x: 38, y: 22 },
        { id: 'v3', label: 'MB1', role: 'Middle 1', team: 'home', x: 44, y: 35 },
        { id: 'v4', label: 'OPP', role: 'Opposite', team: 'home', x: 44, y: 65 },
        { id: 'v5', label: 'OH2', role: 'Outside 2', team: 'home', x: 32, y: 35 },
        { id: 'v6', label: 'L', role: 'Libero', team: 'home', x: 28, y: 50 },
        { id: 'ball', label: '', team: 'ball', x: 38, y: 82 },
      ]);
    }
    this.drawings.set([]);
    this.phases.set([
      { id: 'p1', name: 'Phase 1: Setup', tokens: [...this.tokens()], drawings: [] },
    ]);
    this.currentPhaseIndex.set(0);
    this.saveHistory();
  }

  // Tokens & Drawing Updates
  onTokensUpdated(updated: TacticToken[]): void {
    this.tokens.set(updated);
    this.updateCurrentPhaseData();
    this.saveHistory();
  }

  onDrawingsUpdated(updated: TacticDrawing[]): void {
    this.drawings.set(updated);
    this.updateCurrentPhaseData();
    this.saveHistory();
  }

  // Quick Add Tokens
  addPlayerToken(team: 'home' | 'away'): void {
    const nextNum = this.tokens().filter((t) => t.team === team).length + 1;
    const newToken: TacticToken = {
      id: 'tok-' + Date.now(),
      label: `${nextNum}`,
      team,
      x: team === 'home' ? 35 : 65,
      y: 50,
    };
    const updated = [...this.tokens(), newToken];
    this.tokens.set(updated);
    this.updateCurrentPhaseData();
    this.saveHistory();
  }

  addBallToken(): void {
    const existingBall = this.tokens().find((t) => t.team === 'ball');
    if (existingBall) return;
    const newBall: TacticToken = {
      id: 'ball-' + Date.now(),
      label: '',
      team: 'ball',
      x: 50,
      y: 50,
    };
    const updated = [...this.tokens(), newBall];
    this.tokens.set(updated);
    this.updateCurrentPhaseData();
    this.saveHistory();
  }

  addConeToken(): void {
    const newCone: TacticToken = {
      id: 'cone-' + Date.now(),
      label: '',
      team: 'cone',
      x: 50,
      y: 50,
    };
    const updated = [...this.tokens(), newCone];
    this.tokens.set(updated);
    this.updateCurrentPhaseData();
    this.saveHistory();
  }

  // History & Undo / Redo
  private saveHistory(): void {
    const state = {
      tokens: JSON.parse(JSON.stringify(this.tokens())),
      drawings: JSON.parse(JSON.stringify(this.drawings())),
    };
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    this.historyStack.push(state);
    this.historyIndex = this.historyStack.length - 1;
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.historyStack[this.historyIndex];
      this.tokens.set(JSON.parse(JSON.stringify(state.tokens)));
      this.drawings.set(JSON.parse(JSON.stringify(state.drawings)));
      this.updateCurrentPhaseData();
    }
  }

  redo(): void {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      const state = this.historyStack[this.historyIndex];
      this.tokens.set(JSON.parse(JSON.stringify(state.tokens)));
      this.drawings.set(JSON.parse(JSON.stringify(state.drawings)));
      this.updateCurrentPhaseData();
    }
  }

  clearDrawings(): void {
    this.drawings.set([]);
    this.updateCurrentPhaseData();
    this.saveHistory();
  }

  async clearBoard(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Reset Board',
      message: 'Clear all players, ball, and tactical drawings from the board?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear All',
          role: 'destructive',
          handler: () => {
            this.tokens.set([]);
            this.drawings.set([]);
            this.phases.set([
              { id: 'p1', name: 'Phase 1: Setup', tokens: [], drawings: [] },
            ]);
            this.currentPhaseIndex.set(0);
            this.saveHistory();
          },
        },
      ],
    });
    await alert.present();
  }

  // Multi-Phase Timeline Management
  private updateCurrentPhaseData(): void {
    const idx = this.currentPhaseIndex();
    const currentPhases = this.phases();
    if (currentPhases[idx]) {
      currentPhases[idx].tokens = JSON.parse(JSON.stringify(this.tokens()));
      currentPhases[idx].drawings = JSON.parse(JSON.stringify(this.drawings()));
      this.phases.set([...currentPhases]);
    }
  }

  selectPhase(index: number): void {
    this.updateCurrentPhaseData();
    this.currentPhaseIndex.set(index);
    const p = this.phases()[index];
    if (p) {
      this.tokens.set(JSON.parse(JSON.stringify(p.tokens)));
      this.drawings.set(JSON.parse(JSON.stringify(p.drawings)));
    }
  }

  addPhase(): void {
    this.updateCurrentPhaseData();
    const nextIdx = this.phases().length + 1;
    const newPhase: TacticPhase = {
      id: 'phase-' + Date.now(),
      name: `Phase ${nextIdx}`,
      tokens: JSON.parse(JSON.stringify(this.tokens())),
      drawings: [],
    };
    const updatedPhases = [...this.phases(), newPhase];
    this.phases.set(updatedPhases);
    this.selectPhase(updatedPhases.length - 1);
  }

  deletePhase(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.phases().length <= 1) return;

    const updated = this.phases().filter((_, i) => i !== index);
    this.phases.set(updated);
    const newIdx = Math.max(0, Math.min(this.currentPhaseIndex(), updated.length - 1));
    this.selectPhase(newIdx);
  }

  togglePlayAnimation(): void {
    if (this.isPlayingAnimation()) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  startAnimation(): void {
    if (this.phases().length <= 1) return;
    this.isPlayingAnimation.set(true);

    let idx = this.currentPhaseIndex();
    this.animationInterval = setInterval(() => {
      idx = (idx + 1) % this.phases().length;
      this.selectPhase(idx);
    }, 1500);
  }

  stopAnimation(): void {
    this.isPlayingAnimation.set(false);
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  // Presets & Formation Picker
  async openPresetsModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PresetPickerModal,
      componentProps: {
        sport: this.currentSport(),
      },
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss<PresetFormation>();

    if (role === 'confirm' && data) {
      this.pitchType.set(data.pitchType);
      this.tokens.set(JSON.parse(JSON.stringify(data.tokens)));
      this.drawings.set(JSON.parse(JSON.stringify(data.drawings)));
      this.phases.set([
        {
          id: 'p1',
          name: 'Phase 1: Setup',
          tokens: JSON.parse(JSON.stringify(data.tokens)),
          drawings: JSON.parse(JSON.stringify(data.drawings)),
        },
      ]);
      this.currentPhaseIndex.set(0);
      this.saveHistory();
      this.showToast(`Loaded preset "${data.title}"`);
    }
  }

  // Save Play
  async openSavePlayModal(): Promise<void> {
    this.updateCurrentPhaseData();

    const canvasData: TacticCanvasData = {
      pitchType: this.pitchType(),
      tokens: this.tokens(),
      drawings: this.drawings(),
      phases: this.phases(),
      activePhaseIndex: this.currentPhaseIndex(),
    };

    const modal = await this.modalCtrl.create({
      component: SavePlayModal,
      componentProps: {
        existingPlay: this.tacticsService.activePlay(),
        sport: this.currentSport(),
        pitchType: this.pitchType(),
        canvasData,
      },
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss<CreateTacticPlayDto>();

    if (role === 'confirm' && data) {
      const active = this.tacticsService.activePlay();
      if (active) {
        this.tacticsService.updatePlay(active.id, data).subscribe({
          next: (updated) => {
            this.showToast(`Updated "${updated.title}"`);
          },
        });
      } else {
        this.tacticsService.createPlay(data).subscribe({
          next: (created) => {
            this.showToast(`Saved "${created.title}" to Playbook`);
          },
        });
      }
    }
  }

  // Playbook Library Actions
  loadPlayOnBoard(play: TacticPlay): void {
    this.tacticsService.setActivePlay(play);
    this.pitchType.set(play.pitchType || (play.sport === 'volleyball' ? 'full_court' : 'full_pitch'));
    this.tokens.set(JSON.parse(JSON.stringify(play.canvasData?.tokens || [])));
    this.drawings.set(JSON.parse(JSON.stringify(play.canvasData?.drawings || [])));

    if (play.canvasData?.phases && play.canvasData.phases.length > 0) {
      this.phases.set(JSON.parse(JSON.stringify(play.canvasData.phases)));
      this.currentPhaseIndex.set(play.canvasData.activePhaseIndex || 0);
    } else {
      this.phases.set([
        {
          id: 'p1',
          name: 'Phase 1: Setup',
          tokens: JSON.parse(JSON.stringify(this.tokens())),
          drawings: JSON.parse(JSON.stringify(this.drawings())),
        },
      ]);
      this.currentPhaseIndex.set(0);
    }

    this.viewMode.set('board');
    this.saveHistory();
    this.showToast(`Loaded "${play.title}" onto board`);
  }

  async duplicatePlay(play: TacticPlay): Promise<void> {
    const dto: CreateTacticPlayDto = {
      title: `${play.title} (Copy)`,
      description: play.description,
      sport: play.sport,
      category: play.category,
      pitchType: play.pitchType,
      tags: play.tags,
      canvasData: play.canvasData,
      notes: play.notes,
    };
    this.tacticsService.createPlay(dto).subscribe({
      next: () => {
        this.showToast(`Duplicated "${play.title}"`);
      },
    });
  }

  async deletePlay(play: TacticPlay): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Play',
      message: `Are you sure you want to delete "${play.title}" from your Playbook?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.tacticsService.deletePlay(play.id).subscribe({
              next: () => {
                this.showToast(`Deleted "${play.title}"`);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  seedStandardPresets(): void {
    this.tacticsService.seedPresets(this.currentSport()).subscribe({
      next: () => {
        this.showToast(`Loaded starter ${this.currentSport()} playbook presets!`);
      },
    });
  }

  toggleFullscreen(): void {
    this.isFullscreen.update((v) => !v);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3000);
  }
}
