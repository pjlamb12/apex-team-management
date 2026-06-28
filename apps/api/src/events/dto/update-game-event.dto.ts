import { IsString, IsInt, Min, IsObject, IsOptional } from 'class-validator';

export class UpdateGameEventDto {
  @IsString()
  @IsOptional()
  eventType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minuteOccurred?: number;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}
