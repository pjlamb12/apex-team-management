import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { OpponentsService } from './opponents.service';
import { OpponentEntity } from '../entities/opponent.entity';
import { EventEntity } from '../entities/event.entity';
import { TeamEntity } from '../entities/team.entity';

describe('OpponentsService', () => {
  let service: OpponentsService;
  let opponentRepo: any;
  let eventRepo: any;
  let teamRepo: any;

  const mockTeamId = 'team-uuid-1';
  const mockOpponentId = 'opp-uuid-1';

  const mockOpponent: Partial<OpponentEntity> = {
    id: mockOpponentId,
    teamId: mockTeamId,
    name: 'Thunder FC',
    coachName: 'Coach Dave',
    contactInfo: 'dave@thunder.com',
    primaryColor: '#ff0000',
    secondaryColor: '#ffffff',
    formation: '4-3-3',
    threatLevel: 'high',
    notes: 'Strong attack on the wings',
    tendencies: 'High press in first 15 mins',
    dangerPlayers: [
      {
        id: 'dp-1',
        jerseyNumber: 10,
        name: 'Leo',
        position: 'Forward',
        threatLevel: 'high',
        notes: 'Very fast',
        tags: ['Pacey', 'Left-Footed'],
      },
    ],
    scoutingNotes: [],
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };

  const mockEvents: Partial<EventEntity>[] = [
    {
      id: 'event-1',
      opponentId: mockOpponentId,
      opponent: 'Thunder FC',
      status: 'completed',
      goalsFor: 3,
      goalsAgainst: 1,
      isHomeGame: true,
      scheduledAt: new Date('2026-08-05T10:00:00Z'),
      notes: 'Great match',
      season: { id: 'season-1', teamId: mockTeamId, name: 'Fall 2026' } as any,
      league: { id: 'league-1', name: 'Premier Division' } as any,
      notesList: [],
    },
    {
      id: 'event-2',
      opponentId: mockOpponentId,
      opponent: 'Thunder FC',
      status: 'completed',
      goalsFor: 1,
      goalsAgainst: 2,
      isHomeGame: false,
      scheduledAt: new Date('2026-07-20T10:00:00Z'),
      notes: 'Tough loss',
      season: { id: 'season-1', teamId: mockTeamId, name: 'Fall 2026' } as any,
      league: { id: 'league-1', name: 'Premier Division' } as any,
      notesList: [],
    },
  ];

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      innerJoinAndSelect: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([mockOpponent]),
      getOne: vi.fn().mockResolvedValue(mockOpponent),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockEventQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      innerJoinAndSelect: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(mockEvents),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    opponentRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
      findOne: vi.fn().mockResolvedValue(mockOpponent),
      create: vi.fn().mockImplementation((dto) => ({ ...dto, id: 'new-opp-id' })),
      save: vi.fn().mockImplementation(async (entity) => ({ ...entity, id: entity.id || 'saved-opp-id' })),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    eventRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(mockEventQueryBuilder),
    };

    teamRepo = {
      findOne: vi.fn().mockResolvedValue({ id: mockTeamId, name: 'Apex Strikers' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpponentsService,
        { provide: getRepositoryToken(OpponentEntity), useValue: opponentRepo },
        { provide: getRepositoryToken(EventEntity), useValue: eventRepo },
        { provide: getRepositoryToken(TeamEntity), useValue: teamRepo },
      ],
    }).compile();

    service = module.get<OpponentsService>(OpponentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForTeam', () => {
    it('should return opponents list with aggregated H2H stats', async () => {
      const result = await service.findAllForTeam(mockTeamId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Thunder FC');
      expect(result[0].headToHead).toBeDefined();
      expect(result[0].headToHead.totalGames).toBe(2);
      expect(result[0].headToHead.wins).toBe(1);
      expect(result[0].headToHead.losses).toBe(1);
      expect(result[0].headToHead.draws).toBe(0);
      expect(result[0].headToHead.goalsFor).toBe(4);
      expect(result[0].headToHead.goalsAgainst).toBe(3);
      expect(result[0].headToHead.winPercentage).toBe(50);
    });

    it('should throw NotFoundException if team not found', async () => {
      teamRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findAllForTeam('invalid-team')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return opponent with detailed stats and recent matches', async () => {
      const result = await service.findOne(mockTeamId, mockOpponentId);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockOpponentId);
      expect(result.headToHead.totalGames).toBe(2);
      expect(result.recentMatches).toHaveLength(2);
      expect(result.recentMatches![0].result).toBe('win');
      expect(result.recentMatches![1].result).toBe('loss');
    });

    it('should throw NotFoundException if opponent does not exist', async () => {
      opponentRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(mockTeamId, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new opponent entity', async () => {
      const dto = {
        name: 'Storm SC',
        threatLevel: 'medium' as const,
        dangerPlayers: [
          {
            jerseyNumber: 7,
            name: 'Jordan',
            position: 'Midfielder',
            threatLevel: 'medium' as const,
            notes: 'Good playmaker',
          },
        ],
      };

      const result = await service.create(mockTeamId, dto);
      expect(result).toBeDefined();
      expect(opponentRepo.create).toHaveBeenCalled();
      expect(opponentRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return existing opponent', async () => {
      const dto = {
        name: 'Thunder FC Updated',
        threatLevel: 'critical' as const,
      };

      const result = await service.update(mockTeamId, mockOpponentId, dto);
      expect(result).toBeDefined();
      expect(opponentRepo.save).toHaveBeenCalled();
    });
  });

  describe('scouting notes', () => {
    it('should add a scouting note to the opponent dossier', async () => {
      const note = await service.addScoutingNote(mockTeamId, mockOpponentId, 'Coach Dave', {
        content: 'Dangerous on set pieces near the penalty box',
        tags: ['Tactics', 'Set Pieces'],
      });

      expect(note).toBeDefined();
      expect(note.authorName).toBe('Coach Dave');
      expect(note.content).toBe('Dangerous on set pieces near the penalty box');
      expect(note.tags).toContain('Tactics');
      expect(opponentRepo.save).toHaveBeenCalled();
    });

    it('should delete a scouting note from opponent dossier', async () => {
      opponentRepo.findOne.mockResolvedValueOnce({
        ...mockOpponent,
        scoutingNotes: [
          { id: 'note-1', date: '2026-08-01', content: 'Test note' },
        ],
      });

      await service.deleteScoutingNote(mockTeamId, mockOpponentId, 'note-1');
      expect(opponentRepo.save).toHaveBeenCalled();
    });
  });
});
