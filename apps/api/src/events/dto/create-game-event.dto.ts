import { IsString, IsNotEmpty, IsInt, Min, IsObject, IsOptional } from 'class-validator';

export class CreateGameEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minuteOccurred?: number;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}
