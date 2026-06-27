import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, Min, IsUUID } from 'class-validator';
import { LeagueType } from '../../entities/league.entity';

export class CreateLeagueDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['league', 'tournament', 'session', 'cup', 'other'])
  @IsOptional()
  type?: LeagueType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  playersOnField?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodLengthMinutes?: number;

  @IsString()
  @IsOptional()
  defaultHomeVenue?: string;

  @IsString()
  @IsOptional()
  defaultHomeColor?: string;

  @IsString()
  @IsOptional()
  defaultAwayColor?: string;

  @IsUUID()
  @IsOptional()
  homeLocationId?: string;
}
