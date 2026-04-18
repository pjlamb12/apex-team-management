import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  opponent: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  uniformColor?: string;
}
