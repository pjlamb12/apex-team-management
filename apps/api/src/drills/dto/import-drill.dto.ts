import { IsString, IsNotEmpty, IsOptional, IsUrl, IsArray } from 'class-validator';

export class ImportDrillDto {
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
