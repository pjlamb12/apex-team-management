import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;
  let service: PlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: {
            findAllForTeam: vi.fn(),
            findAllForSeason: vi.fn(),
            findAllForLeague: vi.fn(),
            create: vi.fn(),
            addPlayerToSeason: vi.fn(),
            removePlayerFromSeason: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PlayersController>(PlayersController);
    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAllForTeam with includeInactive false when param is not true', () => {
    controller.findAll('t1');
    expect(service.findAllForTeam).toHaveBeenCalledWith('t1', false);
  });

  it('should call findAllForTeam with includeInactive true when query param is "true"', () => {
    controller.findAll('t1', 'true');
    expect(service.findAllForTeam).toHaveBeenCalledWith('t1', true);
  });

  it('should call findAllForSeason with includeInactive true when query param is "true"', () => {
    controller.findAllForSeason('s1', 'true');
    expect(service.findAllForSeason).toHaveBeenCalledWith('s1', true);
  });
});
