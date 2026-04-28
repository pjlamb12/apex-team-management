import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';

@Injectable()
export class TeamsJoinCodeService {
  private readonly alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  private readonly size = 6;
  private readonly generator = customAlphabet(this.alphabet, this.size);

  generate(): string {
    return this.generator();
  }
}
