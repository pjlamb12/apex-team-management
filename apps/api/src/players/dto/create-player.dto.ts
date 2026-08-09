import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  @IsNotEmpty()
  jerseyNumber: number;

  @IsString()
  @IsOptional()
  preferredPosition?: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsBoolean()
  @IsOptional()
  isGuest?: boolean;

  @IsString()
  @IsOptional()
  leagueId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

