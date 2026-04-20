import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

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
}
