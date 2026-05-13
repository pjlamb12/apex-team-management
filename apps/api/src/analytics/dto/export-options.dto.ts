import { IsEnum, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
}

export enum ExportGranularity {
  AGGREGATED = 'aggregated',
  PER_GAME = 'per-game',
}

export enum ExportLayout {
  OVERVIEW = 'overview',
  PLAYER_PACK = 'player-pack',
  TABULAR = 'tabular',
}

export class ExportOptionsDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsUUID()
  seasonId?: string;

  @IsOptional()
  @IsEnum(ExportGranularity)
  granularity?: ExportGranularity = ExportGranularity.AGGREGATED;

  @IsOptional()
  @IsEnum(ExportLayout)
  layout?: ExportLayout;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeVisuals?: boolean = true;
}
