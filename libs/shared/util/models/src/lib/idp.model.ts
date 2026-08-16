export type GoalCategory =
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'positional'
  | 'general';

export type GoalStatus = 'in_progress' | 'mastered' | 'achieved' | 'deferred';

export type GoalMasteryStage = 'emerging' | 'developing' | 'mastered';

export type GoalTimeframe =
  | 'pre_season'
  | 'mid_season'
  | 'post_season'
  | 'full_season'
  | 'custom';

export type ObservationContext = 'game' | 'practice' | 'one_on_one' | 'general';

export interface GoalPresetDefinition {
  title: string;
  category: GoalCategory;
  description: string;
  defaultTimeframe: GoalTimeframe;
  suggestedFocus: string;
}

export interface PlayerGoalNote {
  id: string;
  goalId: string;
  teamId: string;
  playerId: string;
  eventId?: string | null;
  stage?: GoalMasteryStage | null;
  note: string;
  observedAt: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    type: string;
    opponent?: string | null;
    scheduledAt: string;
  } | null;
}

export interface PlayerGoal {
  id: string;
  teamId: string;
  playerId: string;
  seasonId?: string | null;
  title: string;
  category: GoalCategory;
  status: GoalStatus;
  masteryStage: GoalMasteryStage;
  timeframe: GoalTimeframe;
  targetDate?: string | null;
  description?: string | null;
  baselineAssessment?: string | null;
  notes?: PlayerGoalNote[];
  createdAt: string;
  updatedAt: string;
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber?: number | null;
    preferredPosition?: string | null;
  };
}

export interface CreatePlayerGoalDto {
  playerId: string;
  seasonId?: string | null;
  title: string;
  category: GoalCategory;
  timeframe?: GoalTimeframe;
  targetDate?: string | null;
  description?: string | null;
  baselineAssessment?: string | null;
  masteryStage?: GoalMasteryStage;
}

export interface UpdatePlayerGoalDto {
  title?: string;
  category?: GoalCategory;
  status?: GoalStatus;
  masteryStage?: GoalMasteryStage;
  timeframe?: GoalTimeframe;
  targetDate?: string | null;
  description?: string | null;
  baselineAssessment?: string | null;
}

export interface CreateGoalNoteDto {
  eventId?: string | null;
  stage?: GoalMasteryStage | null;
  note: string;
  observedAt?: string;
}

export interface TeamGoalsSummary {
  totalGoals: number;
  activeGoals: number;
  masteredGoals: number;
  goalsByCategory: Record<GoalCategory, number>;
  goalsByStage: Record<GoalMasteryStage, number>;
  playerGoalsCount: Array<{
    playerId: string;
    firstName: string;
    lastName: string;
    jerseyNumber?: number | null;
    totalGoals: number;
    masteredGoals: number;
  }>;
}

export const DEFAULT_GOAL_PRESETS: GoalPresetDefinition[] = [
  {
    title: 'Scan Field Before Receiving',
    category: 'tactical',
    description: 'Look over shoulders and check passing lanes prior to touching the ball to speed up decision making.',
    defaultTimeframe: 'mid_season',
    suggestedFocus: 'Tactical awareness & Scanning speed',
  },
  {
    title: 'Weak-Foot Passing Accuracy',
    category: 'technical',
    description: 'Confidently receive, control, and distribute short-to-medium range passes using non-dominant foot.',
    defaultTimeframe: 'full_season',
    suggestedFocus: 'Technical balance & Dual-foot competency',
  },
  {
    title: '1v1 Defensive Body Stance & Patience',
    category: 'tactical',
    description: 'Stay low, jockey on balls of feet, delay attacker, and poke-tackle without diving in or fouling.',
    defaultTimeframe: 'mid_season',
    suggestedFocus: 'Defensive fundamentals & Composure',
  },
  {
    title: 'First-Touch into Open Space',
    category: 'technical',
    description: 'Direct first touch away from incoming pressure into attacking space rather than killing ball dead.',
    defaultTimeframe: 'pre_season',
    suggestedFocus: 'Cushioned touch & Positive momentum',
  },
  {
    title: 'Finishing Composure & Shot Selection',
    category: 'technical',
    description: 'Place shots into low corners with inside foot rather than blasting with power in 1v1 keeper moments.',
    defaultTimeframe: 'mid_season',
    suggestedFocus: 'Composure in final third & Target placement',
  },
  {
    title: 'Vocal Communication & Field Leadership',
    category: 'mental',
    description: 'Actively call "man on", "time", "turn", organize defensive shape, and encourage teammates positively.',
    defaultTimeframe: 'full_season',
    suggestedFocus: 'Leadership, Team cohesion, & Voice',
  },
  {
    title: 'High-Workrate Transition Recovery',
    category: 'physical',
    description: 'Immediately sprint back into defensive position upon turnover without hesitation or head drops.',
    defaultTimeframe: 'full_season',
    suggestedFocus: 'Work rate, Pressing stamina, & Resilience',
  },
  {
    title: 'Goalkeeper Command of Box & Distribution',
    category: 'positional',
    description: 'Loudly claim aerial crosses with "Keeper!", organize wall on set pieces, and bowl/throw accurate counters.',
    defaultTimeframe: 'full_season',
    suggestedFocus: 'Box dominance & Quick counter-attack release',
  },
];
