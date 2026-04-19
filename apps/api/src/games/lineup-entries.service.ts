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

  async saveLineup(gameId: string, dto: SaveLineupDto): Promise<LineupEntryEntity[]> {
    // 1. DELETE all existing entries for the gameId.
    await this.lineupRepo.delete({ gameId });

    // 2. Map dto.entries to LineupEntryEntity objects with gameId.
    const entries = dto.entries.map((entry) =>
      this.lineupRepo.create({
        gameId,
        playerId: entry.playerId,
        positionName: entry.positionName,
        status: entry.status,
      }),
    );

    // 3. Bulk INSERT the new set.
    return this.lineupRepo.save(entries);
  }

  async findByGame(gameId: string): Promise<LineupEntryEntity[]> {
    return this.lineupRepo.find({
      where: { gameId },
      relations: ['player'],
    });
  }
}
