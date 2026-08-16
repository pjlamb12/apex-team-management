import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator';
import {
  GoalCategory,
  GoalMasteryStage,
  GoalTimeframe,
} from '@apex-team/shared/util/models';

export class CreateGoalDto {
  @IsUUID()
  @IsNotEmpty()
  playerId: string;

  @IsUUID()
  @IsOptional()
  seasonId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsIn([
    'technical',
    'tactical',
    'physical',
    'mental',
    'positional',
    'general',
  ])
  category: GoalCategory;

  @IsString()
  @IsOptional()
  @IsIn([
    'pre_season',
    'mid_season',
    'post_season',
    'full_season',
    'custom',
  ])
  timeframe?: GoalTimeframe;

  @IsString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  baselineAssessment?: string;

  @IsString()
  @IsOptional()
  @IsIn(['emerging', 'developing', 'mastered'])
  masteryStage?: GoalMasteryStage;
}
