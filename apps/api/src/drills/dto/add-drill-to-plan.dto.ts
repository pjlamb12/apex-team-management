import { IsUUID, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddDrillToPlanDto {
  @IsUUID()
  drillId: string;

  @IsInt()
  @Min(0)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
