import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateSeasonDto {
  @IsUUID()
  teamId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  defaultHomeVenue?: string;

  @IsString()
  @IsOptional()
  defaultHomeColor?: string;

  @IsString()
  @IsOptional()
  defaultAwayColor?: string;

  @IsString()
  @IsOptional()
  defaultPracticeLocation?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
