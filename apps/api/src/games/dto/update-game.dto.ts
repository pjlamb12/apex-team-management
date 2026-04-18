import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class UpdateGameDto {
  @IsString()
  @IsNotEmpty()
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
}
