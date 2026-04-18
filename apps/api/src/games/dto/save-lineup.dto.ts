import { IsArray, IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveLineupEntryDto {
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @IsOptional()
  positionName?: string;

  @IsIn(['starting', 'bench'])
  status: 'starting' | 'bench';
}

export class SaveLineupDto {
  @IsArray()
  @ArrayMaxSize(11)
  @ValidateNested({ each: true })
  @Type(() => SaveLineupEntryDto)
  entries: SaveLineupEntryDto[];
}
