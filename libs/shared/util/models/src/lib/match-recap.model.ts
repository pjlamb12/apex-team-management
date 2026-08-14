export type MatchRecapTone = 'youth_encouraging' | 'developmental' | 'tactical_competitive';

export type MatchRecapFormat = 'email' | 'chat' | 'sms' | 'social';

export interface NextEventSummary {
  id: string;
  type: string;
  opponent?: string;
  scheduledAt: string;
  location?: string;
  uniformColor?: string;
  arrivalMinutesBefore?: number;
}

export interface MatchRecapOptions {
  tone?: MatchRecapTone;
  format?: MatchRecapFormat;
  customCoachNotes?: string;
  includeNextEvent?: boolean;
  includePlayerShoutouts?: boolean;
}

export interface MatchRecapResponse {
  recap: string;
  title: string;
  tone: MatchRecapTone;
  format: MatchRecapFormat;
  prompt: string;
  isAiGenerated: boolean;
  model?: string;
  nextEvent?: NextEventSummary;
  generatedAt: string;
}
