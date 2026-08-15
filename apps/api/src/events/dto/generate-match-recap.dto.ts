import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { MatchRecapTone, MatchRecapFormat } from '@apex-team/shared/util/models';

export class GenerateMatchRecapDto {
  @IsOptional()
  @IsEnum(['youth_encouraging', 'developmental', 'tactical_competitive'])
  tone?: MatchRecapTone;

  @IsOptional()
  @IsEnum(['email', 'chat', 'sms', 'social'])
  format?: MatchRecapFormat;

  @IsOptional()
  @IsString()
  customCoachNotes?: string;

  @IsOptional()
  @IsBoolean()
  includeNextEvent?: boolean;

  @IsOptional()
  @IsBoolean()
  includePlayerShoutouts?: boolean;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
