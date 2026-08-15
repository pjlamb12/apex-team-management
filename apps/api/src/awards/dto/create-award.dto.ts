import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator';
import { AwardCategory } from '@apex-team/shared/util/models';

export class CreateAwardDto {
  @IsUUID()
  @IsNotEmpty()
  playerId: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsUUID()
  @IsOptional()
  seasonId?: string;

  @IsString()
  @IsNotEmpty()
  badgeType: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsIn([
    'mvp',
    'defense',
    'effort',
    'playmaking',
    'character',
    'growth',
    'goalkeeping',
    'finishing',
  ])
  category: AwardCategory;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BatchCreateAwardsDto {
  awards: CreateAwardDto[];
}
