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
  sourceUrl?: string;

  @IsObject()
  @IsNotEmpty()
  instructions: any;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds?: string[];
}
