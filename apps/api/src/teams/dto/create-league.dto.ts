import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
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
}
