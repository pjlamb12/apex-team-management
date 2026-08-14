import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ThreatLevel } from '@apex-team/shared/util/models';

export class DangerPlayerDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsOptional()
  jerseyNumber?: number | null;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsIn(['low', 'medium', 'high', 'critical'])
  threatLevel: ThreatLevel;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CreateOpponentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  coachName?: string;

  @IsString()
  @IsOptional()
  contactInfo?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  formation?: string;

  @IsIn(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  threatLevel?: ThreatLevel;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  tendencies?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DangerPlayerDto)
  @IsOptional()
  dangerPlayers?: DangerPlayerDto[];
}
