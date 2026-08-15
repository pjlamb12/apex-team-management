export type AwardCategory =
  | 'mvp'
  | 'defense'
  | 'effort'
  | 'playmaking'
  | 'character'
  | 'growth'
  | 'goalkeeping'
  | 'finishing';

export interface AwardBadgeDefinition {
  type: string;
  title: string;
  category: AwardCategory;
  icon: string;
  color: string;
  description: string;
}

export interface PlayerAward {
  id: string;
  teamId: string;
  playerId: string;
  eventId?: string | null;
  seasonId?: string | null;
  badgeType: string;
  title: string;
  category: AwardCategory;
  icon: string;
  color: string;
  notes?: string | null;
  awardedAt: string;
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber?: number | null;
    preferredPosition?: string | null;
  };
  event?: {
    id: string;
    type: string;
    opponent?: string | null;
    scheduledAt: string;
  };
}

export interface CreatePlayerAwardDto {
  playerId: string;
  eventId?: string | null;
  seasonId?: string | null;
  badgeType: string;
  title: string;
  category: AwardCategory;
  icon: string;
  color: string;
  notes?: string | null;
}

export interface TeamAwardsSummary {
  totalAwards: number;
  awardsByCategory: Record<string, number>;
  playerAwardCounts: Array<{
    playerId: string;
    firstName: string;
    lastName: string;
    jerseyNumber?: number | null;
    preferredPosition?: string | null;
    awardCount: number;
    lastAwardDate?: string;
    badges: string[];
  }>;
  recentAwards: PlayerAward[];
}

export const DEFAULT_BADGE_PRESETS: AwardBadgeDefinition[] = [
  {
    type: 'player_of_the_match',
    title: 'Player of the Match',
    category: 'mvp',
    icon: 'star-outline',
    color: 'amber',
    description: 'Outstanding overall performance, work ethic, and leadership on the field.',
  },
  {
    type: 'iron_defender',
    title: 'Iron Defender',
    category: 'defense',
    icon: 'shield-outline',
    color: 'blue',
    description: 'Relentless tackling, solid positioning, and decisive defensive stops.',
  },
  {
    type: 'relentless_motor',
    title: 'Relentless Motor',
    category: 'effort',
    icon: 'flash-outline',
    color: 'emerald',
    description: 'Incredible work rate, non-stop pressing, and tireless hustle until the final whistle.',
  },
  {
    type: 'ultimate_teammate',
    title: 'Ultimate Teammate',
    category: 'character',
    icon: 'heart-outline',
    color: 'rose',
    description: 'Exemplary sportsmanship, lifting teammates up, positive talk, and selfless play.',
  },
  {
    type: 'playmaker',
    title: 'Playmaker & Visionary',
    category: 'playmaking',
    icon: 'eye-outline',
    color: 'purple',
    description: 'Creative passing, great vision, scanning, and unlocking opportunities for the team.',
  },
  {
    type: 'breakthrough',
    title: 'Breakthrough Performance',
    category: 'growth',
    icon: 'trending-up-outline',
    color: 'indigo',
    description: 'Massive confidence boost, applying new training skills in live action.',
  },
  {
    type: 'golden_gloves',
    title: 'The Wall / Golden Gloves',
    category: 'goalkeeping',
    icon: 'hand-left-outline',
    color: 'amber',
    description: 'Courageous saves, command of the box, and reliable distribution under pressure.',
  },
  {
    type: 'finisher',
    title: 'Clinical Finisher',
    category: 'finishing',
    icon: 'flame-outline',
    color: 'red',
    description: 'Dangerous attacking presence, clinical composure in front of the goal.',
  },
];
