import { IsArray, IsUUID } from 'class-validator';

export class ReorderPracticeDrillsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
