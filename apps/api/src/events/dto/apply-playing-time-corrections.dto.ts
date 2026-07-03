import { IsArray, IsIn, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SuggestedCorrectionDto {
  @IsUUID()
  gameEventId: string;

  @IsIn(['outPlayerId'])
  field: 'outPlayerId';

  @IsUUID()
  currentPlayerId: string;

  @IsUUID()
  correctedPlayerId: string;
}

export class ApplyPlayingTimeCorrectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuggestedCorrectionDto)
  corrections: SuggestedCorrectionDto[];
}
