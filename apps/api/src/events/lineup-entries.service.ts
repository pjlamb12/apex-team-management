import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { EventEntity } from '../entities/event.entity';
import { SaveLineupDto } from './dto/save-lineup.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class LineupEntriesService {
  constructor(
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @Optional()
    private readonly socketGateway?: SocketGateway,
  ) {}

  async saveLineup(eventId: string, dto: SaveLineupDto): Promise<LineupEntryEntity[]> {
    // 1. Look up event to enforce playersOnField limit
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['season'],
    });
    const maxStarters = event?.playersOnField ?? 11;

    // 2. Separate starters (excluding volleyball libero slot 99) and bench entries
    let starterCount = 0;
    const sanitizedEntries = dto.entries.map((entry) => {
      const isLibero = entry.slotIndex === 99;
      if (entry.status === 'starting' && !isLibero) {
        starterCount++;
        if (starterCount > maxStarters) {
          // Demote excess starter to bench to strictly enforce playersOnField limit
          return {
            ...entry,
            status: 'bench' as const,
            slotIndex: null,
          };
        }
      }
      return entry;
    });

    // 3. DELETE all existing entries for the eventId.
    await this.lineupRepo.delete({ eventId });

    // 4. Map sanitized entries to LineupEntryEntity objects with eventId.
    const entries = sanitizedEntries.map((entry) =>
      this.lineupRepo.create({
        ...entry,
        eventId,
      }),
    );

    // 5. Save all new entries and return with populated player relation.
    await this.lineupRepo.save(entries);
    const saved = await this.findByGame(eventId);

    if (this.socketGateway?.server) {
      this.socketGateway.server.to(`event:${eventId}`).emit('lineupUpdated', { eventId, lineup: saved });
      if (event?.season?.teamId) {
        this.socketGateway.server.to(`team:${event.season.teamId}`).emit('lineupUpdated', { eventId, lineup: saved });
      }
    }

    return saved;
  }

  async findByGame(eventId: string): Promise<LineupEntryEntity[]> {
    return this.lineupRepo.find({
      where: { eventId },
      relations: ['player'],
      order: { slotIndex: 'ASC' },
    });
  }
}

