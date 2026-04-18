import { IsString, IsInt, IsOptional, IsObject, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  eventType: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minuteOccurred?: number;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}
