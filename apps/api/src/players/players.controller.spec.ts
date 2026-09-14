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
            findAllGuestsForTeam: vi.fn(),
            findAllForSeason: vi.fn(),
            findGuestPlayersForSeason: vi.fn(),
            findAllForLeague: vi.fn(),
            create: vi.fn(),
            mergePlayers: vi.fn(),
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

  it('should call findAllGuestsForTeam on findAllGuests', () => {
    controller.findAllGuests('t1');
    expect(service.findAllGuestsForTeam).toHaveBeenCalledWith('t1');
  });

  it('should call findGuestPlayersForSeason on findGuestsForSeason', () => {
    controller.findGuestsForSeason('s1');
    expect(service.findGuestPlayersForSeason).toHaveBeenCalledWith('s1');
  });

  it('should call mergePlayers on merge', () => {
    controller.merge('t1', { targetPlayerId: 'p1', sourcePlayerId: 'p2' });
    expect(service.mergePlayers).toHaveBeenCalledWith('t1', 'p1', 'p2');
  });
});

