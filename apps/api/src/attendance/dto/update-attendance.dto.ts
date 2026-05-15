import { IsUUID, IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateAttendanceDto {
  @IsUUID()
  playerId: string;

  @IsEnum(['present', 'absent', 'tardy', 'injured'])
  status: 'present' | 'absent' | 'tardy' | 'injured';

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BatchUpdateAttendanceDto {
  @IsUUID(undefined, { each: true })
  @IsOptional()
  playerIds?: string[];

  @IsEnum(['present', 'absent', 'tardy', 'injured'])
  status: 'present' | 'absent' | 'tardy' | 'injured';
}
