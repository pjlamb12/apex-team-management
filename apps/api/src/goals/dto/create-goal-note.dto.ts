import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator';
import { GoalMasteryStage } from '@apex-team/shared/util/models';

export class CreateGoalNoteDto {
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['emerging', 'developing', 'mastered'])
  stage?: GoalMasteryStage;

  @IsString()
  @IsNotEmpty()
  note: string;

  @IsString()
  @IsOptional()
  observedAt?: string;
}
