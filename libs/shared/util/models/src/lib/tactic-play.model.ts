export type TacticSport = 'soccer' | 'volleyball';

export type TacticCategory =
  | 'formation'
  | 'set_piece'
  | 'offensive'
  | 'defensive'
  | 'transition'
  | 'drill_setup'
  | 'other';

export type SoccerPitchType =
  | 'full_pitch'
  | 'half_pitch'
  | 'attacking_third'
  | 'penalty_box';

export type VolleyballCourtType =
  | 'full_court'
  | 'half_court'
  | 'rotation_grid';

export type PitchType = SoccerPitchType | VolleyballCourtType;

export type TokenType = 'home' | 'away' | 'ball' | 'cone' | 'target';

export interface TacticToken {
  id: string;
  label: string;
  role?: string;
  team: TokenType;
  x: number; // 0 to 100 percentage of pitch width
  y: number; // 0 to 100 percentage of pitch height
  color?: string;
}

export type DrawingToolType =
  | 'freehand'
  | 'run' // solid arrow
  | 'pass' // dashed arrow
  | 'dribble' // wavy arrow
  | 'zone_rect' // translucent rectangle
  | 'zone_circle'; // translucent circle

export interface TacticDrawing {
  id: string;
  tool: DrawingToolType;
  points: { x: number; y: number }[]; // 0 to 100 percentages
  color: string;
  width: number;
  label?: string;
}

export interface TacticPhase {
  id: string;
  name: string;
  tokens: TacticToken[];
  drawings: TacticDrawing[];
}

export interface TacticCanvasData {
  pitchType: PitchType;
  tokens: TacticToken[];
  drawings: TacticDrawing[];
  phases?: TacticPhase[];
  activePhaseIndex?: number;
}

export interface TacticPlay {
  id: string;
  coachId: string;
  title: string;
  description?: string;
  sport: TacticSport;
  category: TacticCategory;
  pitchType: PitchType;
  tags: string[];
  canvasData: TacticCanvasData;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTacticPlayDto {
  title: string;
  description?: string;
  sport: TacticSport;
  category: TacticCategory;
  pitchType?: PitchType;
  tags?: string[];
  canvasData: TacticCanvasData;
  notes?: string;
}

export interface UpdateTacticPlayDto {
  title?: string;
  description?: string;
  sport?: TacticSport;
  category?: TacticCategory;
  pitchType?: PitchType;
  tags?: string[];
  canvasData?: TacticCanvasData;
  notes?: string;
}
