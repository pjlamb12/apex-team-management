import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SportsService } from './sports.service';
import { Repository } from 'typeorm';
import { SportEntity } from '../entities/sport.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

describe('SportsService', () => {
  let service: SportsService;
  let sportRepo: Partial<Record<keyof Repository<SportEntity>, ReturnType<typeof vi.fn>>>;

  beforeEach(async () => {
    sportRepo = {
      find: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        SportsService,
        { provide: getRepositoryToken(SportEntity), useValue: sportRepo },
      ],
    }).compile();

    service = module.get<SportsService>(SportsService);
  });

  describe('findAllEnabled (TEAM-02)', () => {
    it('should return only sports where isEnabled is true', async () => {
      const enabledSports = [{ id: 'sport-1', name: 'Soccer', isEnabled: true }];
      sportRepo['find']!.mockResolvedValue(enabledSports);

      const result = await service.findAllEnabled();

      expect(sportRepo['find']).toHaveBeenCalledWith({ where: { isEnabled: true } });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Soccer');
    });

    it('should return empty array when no sports are enabled', async () => {
      sportRepo['find']!.mockResolvedValue([]);

      const result = await service.findAllEnabled();

      expect(result).toHaveLength(0);
    });
  });
});
