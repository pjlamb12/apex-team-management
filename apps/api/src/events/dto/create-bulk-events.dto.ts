import { IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';

export class CreateBulkEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventDto)
  events: CreateEventDto[];

  @IsString()
  @IsOptional()
  leagueId?: string;

  @IsString()
  @IsOptional()
  seasonId?: string;
}
