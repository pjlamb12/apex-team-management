import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  parentEmail?: string;
}
