import { PartialType } from '@nestjs/mapped-types';
import { CreateTacticPlayDto } from './create-tactic-play.dto';

export class UpdateTacticPlayDto extends PartialType(CreateTacticPlayDto) {}
