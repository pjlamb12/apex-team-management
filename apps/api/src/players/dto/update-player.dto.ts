import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  jerseyNumber?: number;

  @IsString()
  @IsOptional()
  preferredPosition?: string;

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  parentEmail?: string;

  @IsBoolean()
  @IsOptional()
  isGuest?: boolean;
}
