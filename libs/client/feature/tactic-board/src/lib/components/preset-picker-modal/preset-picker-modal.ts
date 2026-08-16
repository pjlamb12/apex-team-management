import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, flashOutline, gridOutline, footballOutline } from 'ionicons/icons';
import {
  TacticSport,
  TacticToken,
  TacticDrawing,
  PitchType,
} from '@apex-team/shared/util/models';

export interface PresetFormation {
  id: string;
  title: string;
  category: 'formation' | 'set_piece' | 'defensive' | 'offensive';
  sport: TacticSport;
  pitchType: PitchType;
  description: string;
  tokens: TacticToken[];
  drawings: TacticDrawing[];
}

@Component({
  selector: 'app-preset-picker-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
  ],
  templateUrl: './preset-picker-modal.html',
  styleUrl: './preset-picker-modal.scss',
})
export class PresetPickerModal {
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) sport: TacticSport = 'soccer';

  activeCategory: 'all' | 'formation' | 'set_piece' = 'all';

  readonly soccerPresets: PresetFormation[] = [
    {
      id: 'soc_433',
      title: '4-3-3 Balanced',
      category: 'formation',
      sport: 'soccer',
      pitchType: 'full_pitch',
      description: 'Standard 4-3-3 with holding DM and wide wingers.',
      tokens: [
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
      ],
      drawings: [],
    },
    {
      id: 'soc_442',
      title: '4-4-2 Flat',
      category: 'formation',
      sport: 'soccer',
      pitchType: 'full_pitch',
      description: 'Classic dual-striker structure with compact midfield bank.',
      tokens: [
        { id: '1', label: '1', role: 'GK', team: 'home', x: 8, y: 50 },
        { id: '2', label: '2', role: 'RB', team: 'home', x: 25, y: 85 },
        { id: '3', label: '4', role: 'CB', team: 'home', x: 22, y: 62 },
        { id: '4', label: '5', role: 'CB', team: 'home', x: 22, y: 38 },
        { id: '5', label: '3', role: 'LB', team: 'home', x: 25, y: 15 },
        { id: '6', label: '7', role: 'RM', team: 'home', x: 48, y: 85 },
        { id: '7', label: '6', role: 'CM', team: 'home', x: 45, y: 60 },
        { id: '8', label: '8', role: 'CM', team: 'home', x: 45, y: 40 },
        { id: '9', label: '11', role: 'LM', team: 'home', x: 48, y: 15 },
        { id: '10', label: '9', role: 'ST', team: 'home', x: 72, y: 60 },
        { id: '11', label: '10', role: 'ST', team: 'home', x: 72, y: 40 },
        { id: 'ball', label: '', team: 'ball', x: 45, y: 63 },
      ],
      drawings: [],
    },
    {
      id: 'soc_4231',
      title: '4-2-3-1 Modern',
      category: 'formation',
      sport: 'soccer',
      pitchType: 'full_pitch',
      description: 'Double pivot with creative #10 and attacking wide wingers.',
      tokens: [
        { id: '1', label: '1', role: 'GK', team: 'home', x: 8, y: 50 },
        { id: '2', label: '2', role: 'RB', team: 'home', x: 25, y: 85 },
        { id: '3', label: '4', role: 'CB', team: 'home', x: 22, y: 62 },
        { id: '4', label: '5', role: 'CB', team: 'home', x: 22, y: 38 },
        { id: '5', label: '3', role: 'LB', team: 'home', x: 25, y: 15 },
        { id: '6', label: '6', role: 'CDM', team: 'home', x: 40, y: 62 },
        { id: '7', label: '8', role: 'CDM', team: 'home', x: 40, y: 38 },
        { id: '8', label: '7', role: 'RAM', team: 'home', x: 60, y: 80 },
        { id: '9', label: '10', role: 'CAM', team: 'home', x: 58, y: 50 },
        { id: '10', label: '11', role: 'LAM', team: 'home', x: 60, y: 20 },
        { id: '11', label: '9', role: 'ST', team: 'home', x: 76, y: 50 },
        { id: 'ball', label: '', team: 'ball', x: 40, y: 65 },
      ],
      drawings: [],
    },
    {
      id: 'soc_7v7',
      title: '7v7 Youth (2-3-1)',
      category: 'formation',
      sport: 'soccer',
      pitchType: 'full_pitch',
      description: 'Recommended 7v7 youth soccer developmental formation.',
      tokens: [
        { id: '1', label: '1', role: 'GK', team: 'home', x: 10, y: 50 },
        { id: '2', label: '2', role: 'RD', team: 'home', x: 30, y: 70 },
        { id: '3', label: '3', role: 'LD', team: 'home', x: 30, y: 30 },
        { id: '4', label: '7', role: 'RM', team: 'home', x: 55, y: 80 },
        { id: '5', label: '8', role: 'CM', team: 'home', x: 50, y: 50 },
        { id: '6', label: '11', role: 'LM', team: 'home', x: 55, y: 20 },
        { id: '7', label: '9', role: 'ST', team: 'home', x: 75, y: 50 },
        { id: 'ball', label: '', team: 'ball', x: 50, y: 53 },
      ],
      drawings: [],
    },
    {
      id: 'soc_corner',
      title: 'Inswinging Corner Kick Routine',
      category: 'set_piece',
      sport: 'soccer',
      pitchType: 'half_pitch',
      description: 'Near-post decoy run opening space for far-post runner.',
      tokens: [
        { id: 'c1', label: '7', role: 'Taker', team: 'home', x: 96, y: 94 },
        { id: 'c2', label: '9', role: 'Near Post', team: 'home', x: 86, y: 58 },
        { id: 'c3', label: '4', role: 'Far Post', team: 'home', x: 84, y: 42 },
        { id: 'c4', label: '10', role: 'Edge Box', team: 'home', x: 70, y: 50 },
        { id: 'd1', label: 'GK', role: 'GK', team: 'away', x: 96, y: 50 },
        { id: 'd2', label: 'D1', role: 'Def', team: 'away', x: 92, y: 58 },
        { id: 'd3', label: 'D2', role: 'Def', team: 'away', x: 90, y: 44 },
        { id: 'ball', label: '', team: 'ball', x: 96, y: 94 },
      ],
      drawings: [
        {
          id: 'd_pass',
          tool: 'pass',
          color: '#facc15',
          width: 3,
          points: [
            { x: 96, y: 94 },
            { x: 88, y: 48 },
          ],
        },
        {
          id: 'd_run1',
          tool: 'run',
          color: '#38bdf8',
          width: 3,
          points: [
            { x: 86, y: 58 },
            { x: 93, y: 55 },
          ],
        },
      ],
    },
  ];

  readonly volleyballPresets: PresetFormation[] = [
    {
      id: 'vb_51_rot1',
      title: '5-1 System - Rotation 1 (Pos 1 Setter)',
      category: 'formation',
      sport: 'volleyball',
      pitchType: 'full_court',
      description: 'Setter in position 1 (back-right) serving or serve-receive.',
      tokens: [
        { id: 'v1', label: 'S', role: 'Setter', team: 'home', x: 38, y: 78 },
        { id: 'v2', label: 'OH1', role: 'Outside 1', team: 'home', x: 38, y: 22 },
        { id: 'v3', label: 'MB1', role: 'Middle 1', team: 'home', x: 44, y: 35 },
        { id: 'v4', label: 'OPP', role: 'Opposite', team: 'home', x: 44, y: 65 },
        { id: 'v5', label: 'OH2', role: 'Outside 2', team: 'home', x: 32, y: 35 },
        { id: 'v6', label: 'L', role: 'Libero', team: 'home', x: 28, y: 50 },
        { id: 'ball', label: '', team: 'ball', x: 38, y: 82 },
      ],
      drawings: [],
    },
    {
      id: 'vb_62_system',
      title: '6-2 System Standard Setup',
      category: 'formation',
      sport: 'volleyball',
      pitchType: 'full_court',
      description: 'Back-row setter setting, allowing 3 front-row hitters at all times.',
      tokens: [
        { id: 'v1', label: 'S1', role: 'Setter 1', team: 'home', x: 25, y: 80 },
        { id: 'v2', label: 'OH1', role: 'Outside 1', team: 'home', x: 42, y: 20 },
        { id: 'v3', label: 'MB1', role: 'Middle 1', team: 'home', x: 44, y: 50 },
        { id: 'v4', label: 'RS', role: 'Right Side', team: 'home', x: 42, y: 80 },
        { id: 'v5', label: 'OH2', role: 'Outside 2', team: 'home', x: 25, y: 20 },
        { id: 'v6', label: 'L', role: 'Libero', team: 'home', x: 20, y: 50 },
        { id: 'ball', label: '', team: 'ball', x: 25, y: 84 },
      ],
      drawings: [],
    },
    {
      id: 'vb_sr_w',
      title: 'W-Pattern Serve Receive (5-Passer)',
      category: 'set_piece',
      sport: 'volleyball',
      pitchType: 'full_court',
      description: 'Classic 5-player W shape ensuring maximum court coverage on serve receive.',
      tokens: [
        { id: 'w1', label: 'LF', role: 'Left Front', team: 'home', x: 36, y: 22 },
        { id: 'w2', label: 'MF', role: 'Middle Front', team: 'home', x: 32, y: 50 },
        { id: 'w3', label: 'RF', role: 'Right Front', team: 'home', x: 36, y: 78 },
        { id: 'w4', label: 'LB', role: 'Left Back', team: 'home', x: 20, y: 32 },
        { id: 'w5', label: 'RB', role: 'Right Back', team: 'home', x: 20, y: 68 },
        { id: 'w6', label: 'S', role: 'Setter', team: 'home', x: 44, y: 70 },
        { id: 'ball', label: '', team: 'ball', x: 80, y: 50 },
      ],
      drawings: [],
    },
    {
      id: 'vb_def_perimeter',
      title: 'Perimeter Defense (Middle-Back Deep)',
      category: 'defensive',
      sport: 'volleyball',
      pitchType: 'full_court',
      description: '3-player rotational perimeter defense for outside attack coverage.',
      tokens: [
        { id: 'vd1', label: 'B1', role: 'Blocker Left', team: 'home', x: 48, y: 28 },
        { id: 'vd2', label: 'B2', role: 'Blocker Middle', team: 'home', x: 48, y: 40 },
        { id: 'vd3', label: 'LB', role: 'Dig Left', team: 'home', x: 25, y: 25 },
        { id: 'vd4', label: 'MB', role: 'Dig Deep', team: 'home', x: 18, y: 50 },
        { id: 'vd5', label: 'RB', role: 'Dig Right', team: 'home', x: 25, y: 75 },
        { id: 'vd6', label: 'S', role: 'Off-Blocker', team: 'home', x: 42, y: 70 },
        { id: 'ball', label: '', team: 'ball', x: 55, y: 28 },
      ],
      drawings: [],
    },
  ];

  constructor() {
    addIcons({ closeOutline, flashOutline, gridOutline, footballOutline });
  }

  get presets(): PresetFormation[] {
    const list = this.sport === 'soccer' ? this.soccerPresets : this.volleyballPresets;
    if (this.activeCategory === 'all') return list;
    return list.filter((p) => p.category === this.activeCategory);
  }

  selectPreset(preset: PresetFormation): void {
    this.modalCtrl.dismiss(preset, 'confirm');
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
