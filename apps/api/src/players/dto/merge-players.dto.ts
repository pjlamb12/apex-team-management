import { IsNotEmpty, IsUUID } from 'class-validator';

export class MergePlayersDto {
  @IsUUID()
  @IsNotEmpty()
  targetPlayerId: string;

  @IsUUID()
  @IsNotEmpty()
  sourcePlayerId: string;
}
