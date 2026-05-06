import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  homeLocationId?: string;
}
