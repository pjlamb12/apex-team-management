import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  type?: 'game' | 'practice';

  @IsString()
  @IsOptional()
  opponent?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  uniformColor?: string;

  @IsBoolean()
  @IsOptional()
  isHomeGame?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  goalsFor?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  goalsAgainst?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodLengthMinutes?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  currentPeriod?: number;

  @IsString()
  @IsOptional()
  status?: 'scheduled' | 'in_progress' | 'completed';
}
