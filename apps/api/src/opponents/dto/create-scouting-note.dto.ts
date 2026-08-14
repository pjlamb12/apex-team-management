import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateScoutingNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
