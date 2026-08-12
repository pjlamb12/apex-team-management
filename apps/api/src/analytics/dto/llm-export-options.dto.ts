import { IsEnum, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum LlmPromptTemplate {
  PRACTICE_PLAN = 'practice-plan',
  GAME_STRATEGY = 'game-strategy',
  SEASON_DEBRIEF = 'season-debrief',
  PLAYER_EVAL = 'player-eval',
  DRILL_RECOMMENDER = 'drill-recommender',
  OPPONENT_SCOUTING = 'opponent-scouting',
  CUSTOM = 'custom',
}

export enum LlmExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
}

export class LlmExportOptionsDto {
  @IsOptional()
  @IsEnum(LlmPromptTemplate)
  template?: LlmPromptTemplate = LlmPromptTemplate.PRACTICE_PLAN;

  @IsOptional()
  @IsEnum(LlmExportFormat)
  format?: LlmExportFormat = LlmExportFormat.JSON;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' || value === 'undefined' ? undefined : value))
  @IsUUID()
  seasonId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' || value === 'undefined' ? undefined : value))
  @IsUUID()
  leagueId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' || value === 'undefined' ? undefined : value))
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' || value === 'undefined' ? undefined : Number(value)))
  @IsNumber()
  limitGames?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' || value === 'undefined' ? undefined : value))
  @IsString()
  opponent?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' || value === 'undefined' ? undefined : value))
  @IsString()
  customInstructions?: string;
}

