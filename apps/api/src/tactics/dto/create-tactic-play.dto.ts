import { IsNotEmpty, IsOptional, IsString, IsArray, IsObject } from 'class-validator';

export class CreateTacticPlayDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  sport: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  pitchType?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsNotEmpty()
  @IsObject()
  canvasData: any;

  @IsOptional()
  @IsString()
  notes?: string;
}
