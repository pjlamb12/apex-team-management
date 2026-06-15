import { IsUUID, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddDrillToPlanDto {
  @IsOptional()
  @IsUUID()
  drillId?: string;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsInt()
  @Min(0)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
