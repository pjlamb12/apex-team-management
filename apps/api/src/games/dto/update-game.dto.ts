import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isHomeGame?: boolean;
}
