import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

  @IsEmail()
  @IsNotEmpty()
  parentEmail: string;
}
