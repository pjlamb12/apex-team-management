import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineupEntriesService } from './lineup-entries.service';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { EventEntity } from '../entities/event.entity';
import { SaveLineupDto } from './dto/save-lineup.dto';

describe('LineupEntriesService', () => {
  let service: LineupEntriesService;
  let repo: Repository<LineupEntryEntity>;
  let eventRepo: Repository<EventEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineupEntriesService,
        {
          provide: getRepositoryToken(LineupEntryEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((entries) => Promise.resolve(entries)),
            find: vi.fn().mockImplementation(() => Promise.resolve([
              { playerId: 'p1', status: 'starting', positionName: 'GK', eventId: 'event-1' },
              { playerId: 'p2', status: 'bench', eventId: 'event-1' },
            ])),
            delete: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            findOne: vi.fn().mockResolvedValue({ id: 'event-1', playersOnField: 9 }),
          },
        },
      ],
    }).compile();

    service = module.get<LineupEntriesService>(LineupEntriesService);
    repo = module.get<Repository<LineupEntryEntity>>(getRepositoryToken(LineupEntryEntity));
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
  });

  describe('saveLineup', () => {
    const eventId = 'event-1';
    const dto: SaveLineupDto = {
      entries: [
        { playerId: 'p1', status: 'starting', positionName: 'GK' },
        { playerId: 'p2', status: 'bench' },
      ],
    };

    it('should delete existing entries and insert the new set', async () => {
      await service.saveLineup(eventId, dto);

      expect(repo.delete).toHaveBeenCalledWith({ eventId });
      expect(repo.save).toHaveBeenCalled();
    });

    it('should return the saved lineup entries', async () => {
      const result = await service.saveLineup(eventId, dto);

      expect(result).toHaveLength(2);
      expect(result[0].playerId).toBe('p1');
      expect(result[0].eventId).toBe(eventId);
    });

    it('should correctly record starting entries with positionName', async () => {
      const result = await service.saveLineup(eventId, dto);
      expect(result[0].positionName).toBe('GK');
      expect(result[0].status).toBe('starting');
    });

    it('should correctly record bench entries', async () => {
      const result = await service.saveLineup(eventId, dto);
      expect(result[1].status).toBe('bench');
    });

    it('should demote excess starters to bench when exceeding event.playersOnField', async () => {
      // Event has playersOnField: 9, send 10 starters
      const tenStartersDto: SaveLineupDto = {
        entries: Array.from({ length: 10 }, (_, i) => ({
          playerId: `p${i + 1}`,
          status: 'starting' as const,
          positionName: 'MID',
          slotIndex: i,
        })),
      };

      await service.saveLineup(eventId, tenStartersDto);

      expect(repo.create).toHaveBeenCalledTimes(10);
      const calls = (repo.create as any).mock.calls;
      // First 9 should be starting
      for (let i = 0; i < 9; i++) {
        expect(calls[i][0].status).toBe('starting');
      }
      // 10th should be demoted to bench with slotIndex null
      expect(calls[9][0].status).toBe('bench');
      expect(calls[9][0].slotIndex).toBeNull();
    });
  });

  describe('findByGame', () => {
    it('should return all lineup entries for a given eventId', async () => {
      vi.spyOn(repo, 'find').mockResolvedValue([{ id: 'l1' }] as any);

      const result = await service.findByGame('event-1');

      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { eventId: 'event-1' },
      }));
    });
  });
});
