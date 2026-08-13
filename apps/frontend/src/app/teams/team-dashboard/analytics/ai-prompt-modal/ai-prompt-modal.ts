import { Component, inject, signal, Input, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonFooter,
  IonIcon,
  IonSpinner,
  IonToast,
  ModalController,
  Platform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  copyOutline,
  downloadOutline,
  shareOutline,
  sparklesOutline,
  checkmarkOutline,
  footballOutline,
  fitnessOutline,
  trophyOutline,
  personOutline,
  eyeOutline,
  createOutline,
  refreshOutline,
  chevronDownOutline,
  bulbOutline,
} from 'ionicons/icons';
import {
  AnalyticsService,
  SeasonsService,
  LeaguesService,
  PlayersService,
  LlmPromptTemplate,
  LlmPromptResponse,
  PlayerEntity,
} from '@apex-team/client/data-access/team';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Season, League } from '@apex-team/shared/util/models';

export interface PromptTemplateOption {
  id: LlmPromptTemplate;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-ai-prompt-modal',
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
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonFooter,
    IonIcon,
    IonSpinner,
    IonToast,
  ],
  templateUrl: './ai-prompt-modal.html',
  styleUrl: './ai-prompt-modal.scss',
})
export class AiPromptModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly platform = inject(Platform);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly seasonsService = inject(SeasonsService);
  private readonly leaguesService = inject(LeaguesService);
  private readonly playersService = inject(PlayersService);

  @Input({ required: true }) teamId!: string;
  @Input() seasonId?: string;
  @Input() leagueId?: string;
  @Input() initialTemplate?: LlmPromptTemplate;

  protected readonly templates: PromptTemplateOption[] = [
    {
      id: 'practice-plan',
      label: 'Next Practice Plan',
      shortLabel: 'Practice Plan',
      icon: 'fitness-outline',
      description: 'Generates a 75-90 min session targeting weaknesses from recent match logs & drill ratings.',
    },
    {
      id: 'game-strategy',
      label: 'Game Strategy & Lineup',
      shortLabel: 'Lineup & Strategy',
      icon: 'football-outline',
      description: 'Proposes starting formation and balanced sub rotation matrix ensuring equal playtime.',
    },
    {
      id: 'season-debrief',
      label: 'Tournament / Season Debrief',
      shortLabel: 'Season Debrief',
      icon: 'trophy-outline',
      description: 'Comprehensive retrospective on goal patterns, minutes fairness, and tournament trends.',
    },
    {
      id: 'player-eval',
      label: 'Player Evaluation & Goals',
      shortLabel: 'Player Eval',
      icon: 'person-outline',
      description: 'Constructive review covering positional versatility, attendance, and development goals.',
    },
    {
      id: 'drill-recommender',
      label: 'Drill Recommender',
      shortLabel: 'Drills',
      icon: 'bulb-outline',
      description: 'Suggests 5 progressive drills addressing lowest-rated skills and recurring match errors.',
    },
    {
      id: 'opponent-scouting',
      label: 'Opponent Scouting Prep',
      shortLabel: 'Opponent Prep',
      icon: 'eye-outline',
      description: 'Tactical breakdown and game plan based on previous encounters with this rival.',
    },
    {
      id: 'custom',
      label: 'Custom Coaching Prompt',
      shortLabel: 'Custom Prompt',
      icon: 'create-outline',
      description: 'Ask any question or analysis with your full team data dossier included.',
    },
  ];

  protected selectedTemplate = signal<LlmPromptTemplate>('practice-plan');
  protected selectedSeasonId = signal<string | undefined>(undefined);
  protected selectedLeagueId = signal<string | undefined>(undefined);
  protected selectedPlayerId = signal<string | undefined>(undefined);
  protected limitGames = signal<number | undefined>(5);
  protected opponent = signal<string>('');
  protected customInstructions = signal<string>('');

  protected seasons = this.seasonsService.seasons;
  protected leagues = signal<League[]>([]);
  protected players = signal<PlayerEntity[]>([]);

  protected availablePlayers = computed(() => {
    const list = this.players();
    if (this.selectedTemplate() === 'season-debrief') {
      return list;
    }
    return list.filter((p) => !p.isGuest && p.isActive !== false);
  });

  protected isLoading = signal<boolean>(false);
  protected promptResult = signal<LlmPromptResponse | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected isCopied = signal<boolean>(false);
  protected toastMessage = signal<string | null>(null);
  protected isToastOpen = signal<boolean>(false);

  protected promptStats = computed(() => {
    const prompt = this.promptResult()?.prompt || '';
    if (!prompt) return { words: 0, characters: 0, estimatedTokens: 0 };
    const characters = prompt.length;
    const words = prompt.trim().split(/\s+/).filter(Boolean).length;
    const estimatedTokens = Math.round(characters / 4);
    return { words, characters, estimatedTokens };
  });

  constructor() {
    addIcons({
      closeOutline,
      copyOutline,
      downloadOutline,
      shareOutline,
      sparklesOutline,
      checkmarkOutline,
      footballOutline,
      fitnessOutline,
      trophyOutline,
      personOutline,
      eyeOutline,
      createOutline,
      refreshOutline,
      chevronDownOutline,
      bulbOutline,
    });
  }

  async ngOnInit() {
    if (this.initialTemplate) {
      this.selectedTemplate.set(this.initialTemplate);
    }
    if (this.seasonId) {
      this.selectedSeasonId.set(this.seasonId);
      void this.loadLeagues(this.seasonId);
    }
    if (this.leagueId) {
      this.selectedLeagueId.set(this.leagueId);
    }

    void this.loadPlayers();
    void this.generatePrompt();
  }

  protected async loadLeagues(seasonId: string) {
    try {
      const leagues = await firstValueFrom(this.leaguesService.findAllForSeason(seasonId));
      this.leagues.set(leagues);
    } catch {
      console.error('Failed to load leagues');
    }
  }

  protected async loadPlayers() {
    try {
      const seasonId = this.selectedSeasonId();
      const players$ = seasonId
        ? this.playersService.getPlayersForSeason(this.teamId, seasonId)
        : this.playersService.getPlayers(this.teamId);
      const players = await firstValueFrom(players$);
      this.players.set(players);
    } catch {
      console.error('Failed to load players');
    }
  }

  protected selectTemplate(templateId: LlmPromptTemplate) {
    this.selectedTemplate.set(templateId);
    void this.generatePrompt();
  }

  protected onSeasonChange(event: any) {
    const id = event.detail.value;
    this.selectedSeasonId.set(id || undefined);
    this.selectedLeagueId.set(undefined);
    if (id) {
      void this.loadLeagues(id);
    } else {
      this.leagues.set([]);
    }
    void this.generatePrompt();
  }

  protected onLeagueChange(event: any) {
    const id = event.detail.value;
    this.selectedLeagueId.set(id || undefined);
    void this.generatePrompt();
  }

  protected onLimitGamesChange(event: any) {
    const val = event.detail.value;
    if (val === undefined || val === null || val === 'undefined' || val === '' || isNaN(Number(val))) {
      this.limitGames.set(undefined);
    } else {
      this.limitGames.set(Number(val));
    }
    void this.generatePrompt();
  }

  protected onPlayerChange(event: any) {
    const id = event.detail.value;
    this.selectedPlayerId.set(id || undefined);
    void this.generatePrompt();
  }

  protected onOpponentChange(event: any) {
    this.opponent.set(event.detail.value || '');
  }

  protected onCustomInstructionsChange(event: any) {
    this.customInstructions.set(event.detail.value || '');
  }

  protected async generatePrompt() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await firstValueFrom(
        this.analyticsService.getLlmPrompt(this.teamId, {
          template: this.selectedTemplate(),
          seasonId: this.selectedSeasonId(),
          leagueId: this.selectedLeagueId(),
          playerId: this.selectedPlayerId(),
          limitGames: this.limitGames(),
          opponent: this.opponent() || undefined,
          customInstructions: this.customInstructions() || undefined,
        }),
      );
      this.promptResult.set(res);
    } catch (err: any) {
      console.error('Failed to generate prompt', err);
      const detail = err?.error?.message || err?.message || 'Unknown error';
      this.errorMessage.set(`Failed to generate LLM prompt: ${detail}. Please check connection and try again.`);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async copyPrompt() {
    const prompt = this.promptResult()?.prompt;
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      this.isCopied.set(true);
      this.showToast('Copied to clipboard! Ready to paste into ChatGPT, Claude, or Gemini.');
      setTimeout(() => this.isCopied.set(false), 3000);
    } catch (e) {
      console.error('Clipboard copy failed', e);
      this.showToast('Could not copy automatically. Please select text manually.');
    }
  }

  protected async downloadMarkdown() {
    const prompt = this.promptResult()?.prompt;
    if (!prompt) return;

    const template = this.selectedTemplate();
    const filename = `ai-prompt-${template}-${this.teamId}-${Date.now()}.md`;
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' });

    if (this.platform.is('capacitor')) {
      await this.exportMobile(blob, filename);
    } else {
      this.exportWeb(blob, filename);
    }
    this.showToast('Downloaded Markdown file.');
  }

  private exportWeb(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private async exportMobile(blob: Blob, filename: string) {
    try {
      const base64 = await this.blobToBase64(blob);
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: this.promptResult()?.title || 'AI Coaching Prompt',
        text: 'AI Coaching Prompt Dossier',
        url: saved.uri,
        dialogTitle: 'Share AI Prompt',
      });
    } catch (err) {
      console.error('Mobile export failed', err);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }

  protected closeToast() {
    this.isToastOpen.set(false);
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss();
  }
}
