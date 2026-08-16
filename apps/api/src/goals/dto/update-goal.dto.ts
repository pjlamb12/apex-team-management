import {
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';
import {
  GoalCategory,
  GoalStatus,
  GoalMasteryStage,
  GoalTimeframe,
} from '@apex-team/shared/util/models';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'technical',
    'tactical',
    'physical',
    'mental',
    'positional',
    'general',
  ])
  category?: GoalCategory;

  @IsString()
  @IsOptional()
  @IsIn(['in_progress', 'mastered', 'achieved', 'deferred'])
  status?: GoalStatus;

  @IsString()
  @IsOptional()
  @IsIn(['emerging', 'developing', 'mastered'])
  masteryStage?: GoalMasteryStage;

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
}
