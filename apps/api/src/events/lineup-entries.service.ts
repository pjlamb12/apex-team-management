import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { SaveLineupDto } from './dto/save-lineup.dto';

@Injectable()
export class LineupEntriesService {
  constructor(
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
  ) {}

  async saveLineup(eventId: string, dto: SaveLineupDto): Promise<LineupEntryEntity[]> {
    // 1. DELETE all existing entries for the eventId.
    await this.lineupRepo.delete({ eventId });

    // 2. Map dto.entries to LineupEntryEntity objects with eventId.
    const entries = dto.entries.map((entry) =>
      this.lineupRepo.create({
        ...entry,
        eventId,
      }),
    );

    // 3. Save all new entries.
    return this.lineupRepo.save(entries);
  }

  async findByGame(eventId: string): Promise<LineupEntryEntity[]> {
    return this.lineupRepo.find({
      where: { eventId },
      relations: ['player'],
    });
  }
}
