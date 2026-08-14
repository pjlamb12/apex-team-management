import { PartialType } from '@nestjs/mapped-types';
import { CreateOpponentDto } from './create-opponent.dto';

export class UpdateOpponentDto extends PartialType(CreateOpponentDto) {}
