import { IsString, IsNotEmpty, IsOptional, IsUrl, IsArray, IsUUID, IsObject } from 'class-validator';

export class CreateDrillDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  sourceUrl?: string;

  @IsArray()
  @IsNotEmpty()
  instructions: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}
