import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsNotEmpty()
  parentEmail: string;
}
