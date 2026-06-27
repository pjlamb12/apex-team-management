import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, IsUUID } from 'class-validator';

export class UpdateSeasonDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

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

  @IsUUID()
  @IsOptional()
  homeLocationId?: string;

  @IsString()
  @IsOptional()
  defaultPracticeLocation?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodLengthMinutes?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  playersOnField?: number;
}
