import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

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
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  defaultPracticeLocation?: string;
}
