import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdatePracticeDrillDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sequence?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  teamRating?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
