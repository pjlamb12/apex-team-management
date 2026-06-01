import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlayersService } from './players.service';
import { PlayerEntity } from '../entities/player.entity';
import { SeasonPlayerEntity } from '../entities/season-player.entity';

describe('PlayersService', () => {
  let service: PlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SeasonPlayerEntity),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
