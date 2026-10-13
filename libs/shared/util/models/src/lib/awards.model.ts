export type AwardCategory =
  | 'mvp'
  | 'defense'
  | 'effort'
  | 'playmaking'
  | 'character'
  | 'growth'
  | 'goalkeeping'
  | 'finishing'
  | 'rebounding'
  | 'serving'
  | 'blocking';

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

export const SOCCER_BADGE_PRESETS: AwardBadgeDefinition[] = [
  {
    type: 'player_of_the_match',
    title: 'Player of the Match',
    category: 'mvp',
    icon: 'star-outline',
    color: 'amber',
    description: 'Outstanding overall performance, work ethic, and leadership on the pitch.',
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

export const BASKETBALL_BADGE_PRESETS: AwardBadgeDefinition[] = [
  {
    type: 'player_of_the_game',
    title: 'Player of the Game',
    category: 'mvp',
    icon: 'star-outline',
    color: 'amber',
    description: 'Dominant all-around impact, floor leadership, and stepping up in clutch moments.',
  },
  {
    type: 'lockdown_defender',
    title: 'Lockdown Defender',
    category: 'defense',
    icon: 'shield-outline',
    color: 'blue',
    description: 'Tenacious on-ball defense, contesting shots, disrupting passing lanes, and forcing turnovers.',
  },
  {
    type: 'relentless_motor',
    title: 'Relentless Hustle',
    category: 'effort',
    icon: 'flash-outline',
    color: 'emerald',
    description: 'Diving for loose balls, running the floor, crashing the boards, and energy until the final buzzer.',
  },
  {
    type: 'ultimate_teammate',
    title: 'Ultimate Teammate',
    category: 'character',
    icon: 'heart-outline',
    color: 'rose',
    description: 'Vocal communication, setting solid screens, positive bench energy, and selfless play.',
  },
  {
    type: 'floor_general',
    title: 'Floor General',
    category: 'playmaking',
    icon: 'eye-outline',
    color: 'purple',
    description: 'Elite court vision, orchestrating tempo, crisp passing, and setting up open looks.',
  },
  {
    type: 'breakthrough',
    title: 'Breakthrough Performance',
    category: 'growth',
    icon: 'trending-up-outline',
    color: 'indigo',
    description: 'Huge confidence jump, aggressive decision-making, and translating practice into game impact.',
  },
  {
    type: 'paint_protector',
    title: 'Paint Anchor & Board Beast',
    category: 'rebounding',
    icon: 'hand-left-outline',
    color: 'amber',
    description: 'Contesting at the rim, owning the defensive glass, boxing out, and controlling the paint.',
  },
  {
    type: 'sharpshooter',
    title: 'Bucket Getter / Sharpshooter',
    category: 'finishing',
    icon: 'flame-outline',
    color: 'red',
    description: 'High-percentage shotmaking, stretching the floor from deep, and finishing through contact.',
  },
];

export const VOLLEYBALL_BADGE_PRESETS: AwardBadgeDefinition[] = [
  {
    type: 'player_of_the_match',
    title: 'Player of the Match',
    category: 'mvp',
    icon: 'star-outline',
    color: 'amber',
    description: 'All-around excellence, steady serve-receive, court awareness, and leadership in tight sets.',
  },
  {
    type: 'the_roof',
    title: 'The Roof / Net Enforcer',
    category: 'blocking',
    icon: 'hand-left-outline',
    color: 'blue',
    description: 'Dominant block touches, stuffing attacks, sealing the net, and shutting down opponent hitters.',
  },
  {
    type: 'floor_defender',
    title: 'Dig Master / Back-Row Shield',
    category: 'defense',
    icon: 'shield-outline',
    color: 'indigo',
    description: 'Fearless back-row digging, pancake saves, solid platform control, and keeping rallies alive.',
  },
  {
    type: 'relentless_motor',
    title: 'Relentless Rally Hustle',
    category: 'effort',
    icon: 'flash-outline',
    color: 'emerald',
    description: 'Diving pursuit on stray balls, sprint coverage, and non-stop hustle until the ball hits the floor.',
  },
  {
    type: 'ultimate_teammate',
    title: 'Ultimate Teammate',
    category: 'character',
    icon: 'heart-outline',
    color: 'rose',
    description: 'High-energy court communication, celebrating teammates’ points, and maintaining team momentum.',
  },
  {
    type: 'set_maestro',
    title: 'Set Maestro / Pinpoint Hands',
    category: 'playmaking',
    icon: 'eye-outline',
    color: 'purple',
    description: 'Precise setting delivery, deceptive distribution, and putting hitters in rhythm to score.',
  },
  {
    type: 'ace_server',
    title: 'Service Specialist / Ace Hunter',
    category: 'serving',
    icon: 'sparkles-outline',
    color: 'amber',
    description: 'Aggressive serving runs, pinpoint zone targeting, and disrupting opponent serve-receive.',
  },
  {
    type: 'terminal_hitter',
    title: 'Terminal Hitter / The Hammer',
    category: 'finishing',
    icon: 'flame-outline',
    color: 'red',
    description: 'Explosive attacks, terminating long rallies, and finding the floor through or around the block.',
  },
];

export const DEFAULT_BADGE_PRESETS: AwardBadgeDefinition[] = SOCCER_BADGE_PRESETS;

export function getSportBadgePresets(sportName?: string | null): AwardBadgeDefinition[] {
  const normalized = (sportName || '').trim().toLowerCase();
  if (normalized.includes('basket')) {
    return BASKETBALL_BADGE_PRESETS;
  }
  if (normalized.includes('volley')) {
    return VOLLEYBALL_BADGE_PRESETS;
  }
  return SOCCER_BADGE_PRESETS;
}
