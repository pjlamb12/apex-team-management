import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isHomeGame?: boolean;
}
