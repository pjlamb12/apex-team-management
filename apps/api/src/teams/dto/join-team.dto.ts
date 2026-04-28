import { IsString, IsNotEmpty, Length } from 'class-validator';

export class JoinTeamDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
