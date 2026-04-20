import { IsArray, IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveLineupEntryDto {
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @IsOptional()
  positionName?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  slotIndex?: number;

  @IsIn(['starting', 'bench'])
  status: 'starting' | 'bench';
}

export class SaveLineupDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveLineupEntryDto)
  entries: SaveLineupEntryDto[];
}
