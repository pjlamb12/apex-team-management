import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { nanoid } from 'nanoid';
import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { SportEntity } from '../entities/sport.entity';
import { LocationEntity } from '../entities/location.entity';
import { CandidateEntity } from '../entities/candidate.entity';
import { ScoutingRubricEntity } from '../entities/scouting-rubric.entity';
import { PlayerEntity } from '../entities/player.entity';
import { SeasonEntity } from '../entities/season.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { PracticeDrillEntity } from '../entities/practice-drill.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { CandidateAttendanceEntity } from '../entities/candidate-attendance.entity';
import { CandidateEvaluationEntity } from '../entities/candidate-evaluation.entity';
import { SeasonPlayerEntity } from '../entities/season-player.entity';
import { LeagueEntity } from '../entities/league.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsJoinCodeService } from './teams.join-code.service';
import { TeamRole } from '@apex-team/shared/util/models';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly memberRepo: Repository<TeamMemberEntity>,
    private readonly joinCodeService: TeamsJoinCodeService,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByCoach(userId: string): Promise<(TeamEntity & { role?: TeamRole })[]> {
    const teams = await this.teamRepo.createQueryBuilder('team')
      .leftJoinAndSelect('team.sport', 'sport')
      .leftJoinAndSelect('team.members', 'member')
      .where('member.userId = :userId', { userId })
      .orWhere('team.coachId = :userId', { userId })
      .getMany();

    return teams.map(team => {
      const membership = team.members?.find(m => m.userId === userId);
      return {
        ...team,
        role: membership?.role || (team.coachId === userId ? TeamRole.HEAD_COACH : undefined)
      };
    });
  }

  async create(dto: CreateTeamDto, coachId: string): Promise<TeamEntity> {
    const team = this.teamRepo.create({
      name: dto.name,
      sportId: dto.sportId,
      coachId,
      joinCode: this.joinCodeService.generate(),
      calendarSecret: nanoid(),
    });
    
    const savedTeam = await this.teamRepo.save(team);
    
    // Create initial membership
    const member = this.memberRepo.create({
      teamId: savedTeam.id,
      userId: coachId,
      role: TeamRole.HEAD_COACH,
    });
    await this.memberRepo.save(member);
    
    return savedTeam;
  }

  async findOne(id: string, userId?: string): Promise<TeamEntity & { role?: TeamRole }> {
    const team = await this.teamRepo.findOne({
      where: { id },
      relations: ['sport', 'members'],
    });
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    return {
      ...team,
      role: team.members?.find(m => m.userId === userId)?.role || (team.coachId === userId ? TeamRole.HEAD_COACH : undefined)
    };
  }

  async update(id: string, dto: UpdateTeamDto, userId?: string): Promise<TeamEntity> {
    const team = await this.findOne(id, userId);
    Object.assign(team, dto);
    return this.teamRepo.save(team);
  }

  async seedDemo(userId: string, sportName = 'Soccer'): Promise<TeamEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Find the sport
      const sport = await manager.findOne(SportEntity, {
        where: { name: sportName },
      });
      if (!sport) {
        throw new NotFoundException(`${sportName} sport not found`);
      }

      const isVolleyball = sportName === 'Volleyball';
      const isBasketball = sportName === 'Basketball';

      // 2. Create the team
      const team = manager.create(TeamEntity, {
        name: isVolleyball ? 'Apex Spikers VB (Demo)' : isBasketball ? 'Apex Ballers (Demo)' : 'Apex Rangers FC (Demo)',
        sportId: sport.id,
        coachId: userId,
        joinCode: this.joinCodeService.generate(),
        calendarSecret: nanoid(),
      });
      const savedTeam = await manager.save(TeamEntity, team);

      // 3. Create the head coach membership
      const member = manager.create(TeamMemberEntity, {
        teamId: savedTeam.id,
        userId,
        role: TeamRole.HEAD_COACH,
      });
      await manager.save(TeamMemberEntity, member);

      // 4. Create a location
      const location = manager.create(LocationEntity, {
        teamId: savedTeam.id,
        name: isVolleyball ? 'Apex Sports Complex - Court 1' : isBasketball ? 'Apex Sports Complex - Court 2' : 'Apex Sports Complex - Pitch 1',
        address: '123 Apex Way',
        city: 'Salt Lake City',
        state: 'UT',
        zipCode: '84101',
        lat: 40.7608,
        lon: -111.8910,
      });
      const savedLocation = await manager.save(LocationEntity, location);

      // 5. Create a season
      const season = manager.create(SeasonEntity, {
        teamId: savedTeam.id,
        name: 'Fall 2026',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
        isActive: true,
        defaultPracticeLocation: isVolleyball ? 'Apex Sports Complex - Court 1' : isBasketball ? 'Apex Sports Complex - Court 2' : 'Apex Sports Complex - Pitch 1',
      });
      const savedSeason = await manager.save(SeasonEntity, season);

      // 6. Create a league
      const league = manager.create(LeagueEntity, {
        seasonId: savedSeason.id,
        name: isVolleyball ? 'Utah Metro Volleyball League - U14' : isBasketball ? 'Utah Metro Basketball League - U14' : 'Utah Metro Soccer League - U12',
        type: 'league',
        isActive: true,
        playersOnField: isVolleyball ? 6 : isBasketball ? 5 : 9,
        periodCount: isVolleyball ? 3 : isBasketball ? 4 : 2,
        periodLengthMinutes: isVolleyball ? 20 : isBasketball ? 8 : 30,
        defaultHomeVenue: isVolleyball ? 'Apex Sports Complex - Court 1' : isBasketball ? 'Apex Sports Complex - Court 2' : 'Apex Sports Complex - Pitch 1',
        defaultHomeColor: isVolleyball ? 'Blue' : isBasketball ? 'Orange' : 'Red',
        defaultAwayColor: 'White',
        homeLocationId: savedLocation.id,
      });
      const savedLeague = await manager.save(LeagueEntity, league);

      // 7. Create players
      const soccerPlayerSpecs = [
        { firstName: 'Leo', lastName: 'Messi', jerseyNumber: 10, preferredPosition: 'Forward' },
        { firstName: 'Cristiano', lastName: 'Ronaldo', jerseyNumber: 7, preferredPosition: 'Forward' },
        { firstName: 'Kevin', lastName: 'De Bruyne', jerseyNumber: 17, preferredPosition: 'Midfielder' },
        { firstName: 'Virgil', lastName: 'van Dijk', jerseyNumber: 4, preferredPosition: 'Defender' },
        { firstName: 'Alisson', lastName: 'Becker', jerseyNumber: 1, preferredPosition: 'Goalkeeper' },
        { firstName: 'Luka', lastName: 'Modric', jerseyNumber: 10, preferredPosition: 'Midfielder' },
        { firstName: 'Bukayo', lastName: 'Saka', jerseyNumber: 7, preferredPosition: 'Forward' },
        { firstName: 'Declan', lastName: 'Rice', jerseyNumber: 41, preferredPosition: 'Midfielder' },
        { firstName: 'William', lastName: 'Saliba', jerseyNumber: 2, preferredPosition: 'Defender' },
        { firstName: 'Gabriel', lastName: 'Magalhaes', jerseyNumber: 6, preferredPosition: 'Defender' },
        { firstName: 'Ben', lastName: 'White', jerseyNumber: 4, preferredPosition: 'Defender' },
        { firstName: 'Erling', lastName: 'Haaland', jerseyNumber: 9, preferredPosition: 'Forward' },
      ];

      const volleyballPlayerSpecs = [
        { firstName: 'Jordyn', lastName: 'Poulter', jerseyNumber: 1, preferredPosition: 'Setter' },
        { firstName: 'Dani', lastName: 'Drews', jerseyNumber: 9, preferredPosition: 'Outside Hitter' },
        { firstName: 'Haleigh', lastName: 'Washington', jerseyNumber: 15, preferredPosition: 'Middle Blocker' },
        { firstName: 'Skylar', lastName: 'Fields', jerseyNumber: 5, preferredPosition: 'Opposite Hitter' },
        { firstName: 'Alexa', lastName: 'Gray', jerseyNumber: 10, preferredPosition: 'Outside Hitter' },
        { firstName: 'Tori', lastName: 'Dixon', jerseyNumber: 6, preferredPosition: 'Middle Blocker' },
        { firstName: 'Madi', lastName: 'Bugg', jerseyNumber: 8, preferredPosition: 'Setter' },
        { firstName: 'Manami', lastName: 'Kojima', jerseyNumber: 16, preferredPosition: 'Libero' },
        { firstName: 'Roni', lastName: 'Jones-Perry', jerseyNumber: 12, preferredPosition: 'Outside Hitter' },
        { firstName: 'Heidy', lastName: 'Casanova', jerseyNumber: 14, preferredPosition: 'Opposite Hitter' },
        { firstName: 'Serena', lastName: 'Gray', jerseyNumber: 11, preferredPosition: 'Middle Blocker' },
        { firstName: 'Mary', lastName: 'Lake', jerseyNumber: 17, preferredPosition: 'Libero' },
      ];

      const basketballPlayerSpecs = [
        { firstName: 'Steph', lastName: 'Curry', jerseyNumber: 30, preferredPosition: 'PG' },
        { firstName: 'Klay', lastName: 'Thompson', jerseyNumber: 11, preferredPosition: 'SG' },
        { firstName: 'LeBron', lastName: 'James', jerseyNumber: 23, preferredPosition: 'SF' },
        { firstName: 'Kevin', lastName: 'Durant', jerseyNumber: 35, preferredPosition: 'PF' },
        { firstName: 'Nikola', lastName: 'Jokic', jerseyNumber: 15, preferredPosition: 'C' },
        { firstName: 'Chris', lastName: 'Paul', jerseyNumber: 3, preferredPosition: 'PG' },
        { firstName: 'Devin', lastName: 'Booker', jerseyNumber: 1, preferredPosition: 'SG' },
        { firstName: 'Kawhi', lastName: 'Leonard', jerseyNumber: 2, preferredPosition: 'SF' },
        { firstName: 'Giannis', lastName: 'Antetokounmpo', jerseyNumber: 34, preferredPosition: 'PF' },
        { firstName: 'Joel', lastName: 'Embiid', jerseyNumber: 21, preferredPosition: 'C' },
        { firstName: 'Jayson', lastName: 'Tatum', jerseyNumber: 0, preferredPosition: 'SF' },
        { firstName: 'Anthony', lastName: 'Davis', jerseyNumber: 8, preferredPosition: 'PF' },
      ];

      const playerSpecs = isVolleyball ? volleyballPlayerSpecs : isBasketball ? basketballPlayerSpecs : soccerPlayerSpecs;

      const savedPlayers: PlayerEntity[] = [];
      for (const spec of playerSpecs) {
        const player = manager.create(PlayerEntity, {
          teamId: savedTeam.id,
          ...spec,
        });
        const savedPlayer = await manager.save(PlayerEntity, player);
        savedPlayers.push(savedPlayer);

        // Add SeasonPlayer mapping
        const seasonPlayer = manager.create(SeasonPlayerEntity, {
          seasonId: savedSeason.id,
          playerId: savedPlayer.id,
        });
        await manager.save(SeasonPlayerEntity, seasonPlayer);
      }

      // Helper map for player names to objects
      const pMap = (first: string) => savedPlayers.find((p) => p.firstName === first)!;

      // 8. Create Events
      // 8.1 Completed Game (3 days ago)
      const pastGame = manager.create(EventEntity, {
        seasonId: savedSeason.id,
        leagueId: savedLeague.id,
        type: 'game',
        opponent: isVolleyball ? 'Thunder VB' : isBasketball ? 'Thunder Basketball' : 'Thunder FC',
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        durationMinutes: isBasketball ? 48 : 60,
        location: isVolleyball ? 'Thunder VB Arena' : isBasketball ? 'Thunder Fieldhouse' : 'Thunder FC Field',
        isHomeGame: false,
        status: 'completed',
        goalsFor: isVolleyball ? 2 : isBasketball ? 64 : 3, // Sets won for Volleyball, Points for Basketball, Goals for Soccer
        goalsAgainst: isVolleyball ? 1 : isBasketball ? 58 : 1,
        periodCount: isVolleyball ? 3 : isBasketball ? 4 : 2,
        periodLengthMinutes: isVolleyball ? 20 : isBasketball ? 8 : 30,
        playersOnField: isVolleyball ? 6 : isBasketball ? 5 : 9,
        currentPeriod: isVolleyball ? 3 : isBasketball ? 4 : 2,
      });
      const savedPastGame = await manager.save(EventEntity, pastGame);

      // Attendance for past game
      for (const player of savedPlayers) {
        const isInjured = (!isVolleyball && !isBasketball && player.firstName === 'Cristiano' && player.lastName === 'Ronaldo') ||
          (isBasketball && player.firstName === 'Chris' && player.lastName === 'Paul');
        const attendance = manager.create(AttendanceEntity, {
          eventId: savedPastGame.id,
          playerId: player.id,
          status: isInjured ? 'injured' : 'present',
          notes: isInjured ? (isBasketball ? 'Slight ankle sprain' : 'Slight hamstring strain') : null,
        });
        await manager.save(AttendanceEntity, attendance);
      }

      // Lineup entries for past game
      const soccerStartingLineup = [
        { first: 'Alisson', pos: 'GK', slot: 0 },
        { first: 'Ben', pos: 'RB', slot: 1 },
        { first: 'Virgil', pos: 'CB', slot: 2 },
        { first: 'William', pos: 'CB', slot: 3 },
        { first: 'Gabriel', pos: 'LB', slot: 4 },
        { first: 'Luka', pos: 'CM', slot: 5 },
        { first: 'Kevin', pos: 'CM', slot: 6 },
        { first: 'Leo', pos: 'ST', slot: 7 },
        { first: 'Erling', pos: 'ST', slot: 8 },
      ];

      const volleyballStartingLineup = [
        { first: 'Jordyn', pos: 'Setter', slot: 0 },
        { first: 'Dani', pos: 'Outside Hitter', slot: 1 },
        { first: 'Haleigh', pos: 'Middle Blocker', slot: 2 },
        { first: 'Skylar', pos: 'Opposite Hitter', slot: 3 },
        { first: 'Alexa', pos: 'Outside Hitter', slot: 4 },
        { first: 'Tori', pos: 'Middle Blocker', slot: 5 },
      ];

      const basketballStartingLineup = [
        { first: 'Steph', pos: 'PG', slot: 0 },
        { first: 'Klay', pos: 'SG', slot: 1 },
        { first: 'LeBron', pos: 'SF', slot: 2 },
        { first: 'Kevin', pos: 'PF', slot: 3 },
        { first: 'Nikola', pos: 'C', slot: 4 },
      ];

      const startingLineup = isVolleyball ? volleyballStartingLineup : isBasketball ? basketballStartingLineup : soccerStartingLineup;

      for (const player of savedPlayers) {
        const starter = startingLineup.find((s) => s.first === player.firstName);
        const lineupEntry = manager.create(LineupEntryEntity, {
          eventId: savedPastGame.id,
          playerId: player.id,
          status: starter ? 'starting' : 'bench',
          positionName: starter ? starter.pos : null,
          slotIndex: starter ? starter.slot : null,
        });
        await manager.save(LineupEntryEntity, lineupEntry);
      }

      // Game events for past game
      if (isVolleyball) {
        // Set 1 (Period 1): 25-23 (Team wins)
        for (let i = 0; i < 21; i++) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: 'POINT_WON',
            period: 1,
            minuteOccurred: 0,
            payload: {}
          }));
        }
        for (let i = 0; i < 22; i++) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: 'POINT_LOST',
            period: 1,
            minuteOccurred: 0,
            payload: {}
          }));
        }
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'ACE',
          period: 1,
          minuteOccurred: 0,
          payload: { scorerId: pMap('Jordyn').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'KILL',
          period: 1,
          minuteOccurred: 0,
          payload: { scorerId: pMap('Dani').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'BLOCK',
          period: 1,
          minuteOccurred: 0,
          payload: { playerId: pMap('Haleigh').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'KILL',
          period: 1,
          minuteOccurred: 0,
          payload: { scorerId: pMap('Dani').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'SERVICE_ERROR',
          period: 1,
          minuteOccurred: 0,
          payload: { playerId: pMap('Skylar').id }
        }));

        // Set 2 (Period 2): 18-25 (Opponent wins)
        for (let i = 0; i < 17; i++) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: 'POINT_WON',
            period: 2,
            minuteOccurred: 0,
            payload: {}
          }));
        }
        for (let i = 0; i < 23; i++) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: 'POINT_LOST',
            period: 2,
            minuteOccurred: 0,
            payload: {}
          }));
        }
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'KILL',
          period: 2,
          minuteOccurred: 0,
          payload: { scorerId: pMap('Skylar').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'SERVICE_ERROR',
          period: 2,
          minuteOccurred: 0,
          payload: { playerId: pMap('Jordyn').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'HITTING_ERROR',
          period: 2,
          minuteOccurred: 0,
          payload: { playerId: pMap('Dani').id }
        }));

        // Set 3 (Period 3): 15-13 (Team wins)
        for (let i = 0; i < 12; i++) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: 'POINT_WON',
            period: 3,
            minuteOccurred: 0,
            payload: {}
          }));
        }
        for (let i = 0; i < 13; i++) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: 'POINT_LOST',
            period: 3,
            minuteOccurred: 0,
            payload: {}
          }));
        }
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'KILL',
          period: 3,
          minuteOccurred: 0,
          payload: { scorerId: pMap('Dani').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'BLOCK',
          period: 3,
          minuteOccurred: 0,
          payload: { playerId: pMap('Haleigh').id }
        }));
        await manager.save(GameEventEntity, manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'ACE',
          period: 3,
          minuteOccurred: 0,
          payload: { scorerId: pMap('Madi').id }
        }));
      } else if (isBasketball) {
        // Basketball Game events: 64-58 victory vs Thunder Basketball
        const bballEvents = [
          // Period 1 (16 - 14)
          { eventType: 'MADE_2PT', period: 1, minuteOccurred: 1, payload: { scorerId: pMap('LeBron').id, coordinates: { x: 45, y: 35 } } },
          { eventType: 'REBOUND_OFFENSIVE', period: 1, minuteOccurred: 1, payload: { playerId: pMap('Nikola').id } },
          { eventType: 'MADE_2PT', period: 1, minuteOccurred: 2, payload: { scorerId: pMap('Nikola').id, assistorId: pMap('Steph').id, coordinates: { x: 50, y: 20 } } },
          { eventType: 'OPPONENT_SCORE', period: 1, minuteOccurred: 3, payload: { points: 2 } },
          { eventType: 'MADE_3PT', period: 1, minuteOccurred: 4, payload: { scorerId: pMap('Steph').id, assistorId: pMap('LeBron').id, coordinates: { x: 25, y: 70 } } },
          { eventType: 'FOUL', period: 1, minuteOccurred: 5, payload: { playerId: pMap('Kevin').id } },
          { eventType: 'OPPONENT_SCORE', period: 1, minuteOccurred: 5, payload: { points: 2 } },
          { eventType: 'STEAL', period: 1, minuteOccurred: 6, payload: { playerId: pMap('Steph').id } },
          { eventType: 'MADE_2PT', period: 1, minuteOccurred: 6, payload: { scorerId: pMap('Klay').id, assistorId: pMap('Steph').id, coordinates: { x: 30, y: 40 } } },
          { eventType: 'OPPONENT_SCORE', period: 1, minuteOccurred: 6, payload: { points: 3 } },
          { eventType: 'MADE_1PT', period: 1, minuteOccurred: 7, payload: { scorerId: pMap('Nikola').id } },
          { eventType: 'MADE_1PT', period: 1, minuteOccurred: 7, payload: { scorerId: pMap('Nikola').id } },
          { eventType: 'OPPONENT_SCORE', period: 1, minuteOccurred: 7, payload: { points: 2 } },
          { eventType: 'MADE_3PT', period: 1, minuteOccurred: 8, payload: { scorerId: pMap('Klay').id, assistorId: pMap('Nikola').id, coordinates: { x: 75, y: 68 } } },
          { eventType: 'MADE_2PT', period: 1, minuteOccurred: 8, payload: { scorerId: pMap('LeBron').id, coordinates: { x: 50, y: 15 } } },
          { eventType: 'OPPONENT_SCORE', period: 1, minuteOccurred: 8, payload: { points: 5 } },

          // Period 2 (18 - 15) -> Total: 34 - 29
          { eventType: 'BLOCK', period: 2, minuteOccurred: 1, payload: { playerId: pMap('Giannis').id } },
          { eventType: 'REBOUND_DEFENSIVE', period: 2, minuteOccurred: 1, payload: { playerId: pMap('Giannis').id } },
          { eventType: 'MADE_2PT', period: 2, minuteOccurred: 2, payload: { scorerId: pMap('Giannis').id, coordinates: { x: 50, y: 12 } } },
          { eventType: 'TURNOVER', period: 2, minuteOccurred: 3, payload: { playerId: pMap('Devin').id } },
          { eventType: 'OPPONENT_SCORE', period: 2, minuteOccurred: 3, payload: { points: 2 } },
          { eventType: 'MADE_3PT', period: 2, minuteOccurred: 4, payload: { scorerId: pMap('Devin').id, coordinates: { x: 35, y: 72 } } },
          { eventType: 'OPPONENT_SCORE', period: 2, minuteOccurred: 4, payload: { points: 2 } },
          { eventType: 'MADE_2PT', period: 2, minuteOccurred: 5, payload: { scorerId: pMap('Kevin').id, assistorId: pMap('Steph').id, coordinates: { x: 60, y: 45 } } },
          { eventType: 'OPPONENT_SCORE', period: 2, minuteOccurred: 5, payload: { points: 3 } },
          { eventType: 'MADE_3PT', period: 2, minuteOccurred: 6, payload: { scorerId: pMap('Steph').id, coordinates: { x: 50, y: 75 } } },
          { eventType: 'OPPONENT_SCORE', period: 2, minuteOccurred: 6, payload: { points: 2 } },
          { eventType: 'MADE_2PT', period: 2, minuteOccurred: 7, payload: { scorerId: pMap('Kevin').id, assistorId: pMap('LeBron').id, coordinates: { x: 40, y: 38 } } },
          { eventType: 'MADE_2PT', period: 2, minuteOccurred: 7, payload: { scorerId: pMap('LeBron').id, coordinates: { x: 52, y: 22 } } },
          { eventType: 'OPPONENT_SCORE', period: 2, minuteOccurred: 7, payload: { points: 3 } },
          { eventType: 'MADE_3PT', period: 2, minuteOccurred: 8, payload: { scorerId: pMap('Klay').id, assistorId: pMap('Nikola').id, coordinates: { x: 80, y: 65 } } },
          { eventType: 'MADE_1PT', period: 2, minuteOccurred: 8, payload: { scorerId: pMap('Giannis').id } },
          { eventType: 'OPPONENT_SCORE', period: 2, minuteOccurred: 8, payload: { points: 3 } },

          // Period 3 (14 - 15) -> Total: 48 - 44
          { eventType: 'MADE_2PT', period: 3, minuteOccurred: 1, payload: { scorerId: pMap('Nikola').id, coordinates: { x: 48, y: 18 } } },
          { eventType: 'OPPONENT_SCORE', period: 3, minuteOccurred: 2, payload: { points: 2 } },
          { eventType: 'STEAL', period: 3, minuteOccurred: 3, payload: { playerId: pMap('Klay').id } },
          { eventType: 'MADE_3PT', period: 3, minuteOccurred: 3, payload: { scorerId: pMap('Steph').id, coordinates: { x: 22, y: 70 } } },
          { eventType: 'OPPONENT_SCORE', period: 3, minuteOccurred: 4, payload: { points: 3 } },
          { eventType: 'MADE_2PT', period: 3, minuteOccurred: 5, payload: { scorerId: pMap('LeBron').id, coordinates: { x: 50, y: 20 } } },
          { eventType: 'OPPONENT_SCORE', period: 3, minuteOccurred: 5, payload: { points: 2 } },
          { eventType: 'BLOCK', period: 3, minuteOccurred: 6, payload: { playerId: pMap('Nikola').id } },
          { eventType: 'MADE_2PT', period: 3, minuteOccurred: 6, payload: { scorerId: pMap('Kevin').id, assistorId: pMap('Steph').id, coordinates: { x: 65, y: 35 } } },
          { eventType: 'OPPONENT_SCORE', period: 3, minuteOccurred: 6, payload: { points: 3 } },
          { eventType: 'MADE_3PT', period: 3, minuteOccurred: 7, payload: { scorerId: pMap('Klay').id, assistorId: pMap('LeBron').id, coordinates: { x: 78, y: 66 } } },
          { eventType: 'OPPONENT_SCORE', period: 3, minuteOccurred: 7, payload: { points: 3 } },
          { eventType: 'MADE_2PT', period: 3, minuteOccurred: 8, payload: { scorerId: pMap('Giannis').id, coordinates: { x: 50, y: 15 } } },
          { eventType: 'OPPONENT_SCORE', period: 3, minuteOccurred: 8, payload: { points: 2 } },

          // Period 4 (16 - 14) -> Total: 64 - 58
          { eventType: 'MADE_2PT', period: 4, minuteOccurred: 1, payload: { scorerId: pMap('Steph').id, coordinates: { x: 42, y: 30 } } },
          { eventType: 'OPPONENT_SCORE', period: 4, minuteOccurred: 2, payload: { points: 2 } },
          { eventType: 'MADE_3PT', period: 4, minuteOccurred: 3, payload: { scorerId: pMap('Steph').id, coordinates: { x: 28, y: 72 } } },
          { eventType: 'OPPONENT_SCORE', period: 4, minuteOccurred: 3, payload: { points: 3 } },
          { eventType: 'STEAL', period: 4, minuteOccurred: 4, payload: { playerId: pMap('LeBron').id } },
          { eventType: 'MADE_2PT', period: 4, minuteOccurred: 4, payload: { scorerId: pMap('LeBron').id, coordinates: { x: 50, y: 16 } } },
          { eventType: 'OPPONENT_SCORE', period: 4, minuteOccurred: 5, payload: { points: 2 } },
          { eventType: 'MADE_2PT', period: 4, minuteOccurred: 5, payload: { scorerId: pMap('Nikola').id, assistorId: pMap('Steph').id, coordinates: { x: 49, y: 22 } } },
          { eventType: 'OPPONENT_SCORE', period: 4, minuteOccurred: 6, payload: { points: 2 } },
          { eventType: 'MADE_3PT', period: 4, minuteOccurred: 7, payload: { scorerId: pMap('Klay').id, assistorId: pMap('Nikola').id, coordinates: { x: 74, y: 70 } } },
          { eventType: 'OPPONENT_SCORE', period: 4, minuteOccurred: 7, payload: { points: 3 } },
          { eventType: 'FOUL', period: 4, minuteOccurred: 7, payload: { playerId: pMap('Steph').id } },
          { eventType: 'OPPONENT_SCORE', period: 4, minuteOccurred: 8, payload: { points: 2 } },
          { eventType: 'MADE_2PT', period: 4, minuteOccurred: 8, payload: { scorerId: pMap('Kevin').id, assistorId: pMap('Steph').id, coordinates: { x: 55, y: 40 } } },
          { eventType: 'MADE_1PT', period: 4, minuteOccurred: 8, payload: { scorerId: pMap('Steph').id } },
          { eventType: 'MADE_1PT', period: 4, minuteOccurred: 8, payload: { scorerId: pMap('Steph').id } },
        ];

        for (const ev of bballEvents) {
          await manager.save(GameEventEntity, manager.create(GameEventEntity, {
            eventId: savedPastGame.id,
            eventType: ev.eventType,
            period: ev.period,
            minuteOccurred: ev.minuteOccurred,
            payload: ev.payload,
          }));
        }
      } else {
        // Soccer Game events
        // Goal 1: Erling assisted by Kevin at minute 12
        const gameEvent1 = manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'GOAL',
          minuteOccurred: 12,
          payload: {
            scorerId: pMap('Erling').id,
            assistorId: pMap('Kevin').id,
          },
        });
        await manager.save(GameEventEntity, gameEvent1);

        // Opponent Goal at minute 24
        const gameEvent2 = manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'OPPONENT_GOAL',
          minuteOccurred: 24,
          payload: {},
        });
        await manager.save(GameEventEntity, gameEvent2);

        // Goal 2: Leo Messi at minute 45
        const gameEvent3 = manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'GOAL',
          minuteOccurred: 45,
          payload: {
            scorerId: pMap('Leo').id,
          },
        });
        await manager.save(GameEventEntity, gameEvent3);

        // Goal 3: Erling assisted by Leo at minute 58
        const gameEvent4 = manager.create(GameEventEntity, {
          eventId: savedPastGame.id,
          eventType: 'GOAL',
          minuteOccurred: 58,
          payload: {
            scorerId: pMap('Erling').id,
            assistorId: pMap('Leo').id,
          },
        });
        await manager.save(GameEventEntity, gameEvent4);
      }

      // 8.2 Scheduled Game (4 days in future)
      const futureGame = manager.create(EventEntity, {
        seasonId: savedSeason.id,
        leagueId: savedLeague.id,
        type: 'game',
        opponent: isVolleyball ? 'Lightning VB' : isBasketball ? 'Lightning Basketball' : 'Lightning SC',
        scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        durationMinutes: isBasketball ? 48 : 60,
        location: isVolleyball ? 'Apex Sports Complex - Court 1' : isBasketball ? 'Apex Sports Complex - Court 2' : 'Apex Sports Complex - Pitch 1',
        locationId: savedLocation.id,
        isHomeGame: true,
        status: 'scheduled',
        periodCount: isVolleyball ? 3 : isBasketball ? 4 : 2,
        periodLengthMinutes: isVolleyball ? 20 : isBasketball ? 8 : 30,
        playersOnField: isVolleyball ? 6 : isBasketball ? 5 : 9,
        currentPeriod: 1,
      });
      const savedFutureGame = await manager.save(EventEntity, futureGame);

      // Attendance for future game
      for (const player of savedPlayers) {
        const attendance = manager.create(AttendanceEntity, {
          eventId: savedFutureGame.id,
          playerId: player.id,
          status: 'present',
        });
        await manager.save(AttendanceEntity, attendance);
      }

      // 8.3 Scheduled Practice (2 days in future)
      const futurePractice = manager.create(EventEntity, {
        seasonId: savedSeason.id,
        type: 'practice',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        durationMinutes: 90,
        location: isVolleyball ? 'Apex Sports Complex - Court 1' : isBasketball ? 'Apex Sports Complex - Court 2' : 'Apex Sports Complex - Pitch 1',
        locationId: savedLocation.id,
        status: 'scheduled',
      });
      const savedFuturePractice = await manager.save(EventEntity, futurePractice);

      // Practice drills
      const practiceDrill1 = manager.create(PracticeDrillEntity, {
        eventId: savedFuturePractice.id,
        drillId: null,
        customName: isVolleyball ? 'Serve & Receive Warmup' : isBasketball ? 'Three-Man Weave & Layup Lines' : 'Rondo (5v2 Warmup)',
        sequence: 1,
        durationMinutes: 15,
        notes: isVolleyball ? 'Focus on clean underhand/overhead passing and target areas.' : isBasketball ? 'Fastbreak passing on the move, focusing on crisp chest passes and finishing strong at the rim.' : 'Focus on quick, 1-touch passing and moving to open space.',
      });
      await manager.save(PracticeDrillEntity, practiceDrill1);

      const practiceDrill2 = manager.create(PracticeDrillEntity, {
        eventId: savedFuturePractice.id,
        drillId: null,
        customName: isVolleyball ? '6v6 Transition Play' : isBasketball ? '5v5 Shell Drill & Transition Defense' : 'Shooting on Crosses',
        sequence: 2,
        durationMinutes: 25,
        notes: isVolleyball ? 'Simulated match play focusing on free ball and down ball transition attacking.' : isBasketball ? 'Defensive communication, denying middle penetration, and fastbreak recovery.' : 'Winger crosses from deep, attacking midfielders and strikers timing their runs into the box.',
      });
      await manager.save(PracticeDrillEntity, practiceDrill2);

      return savedTeam;
    });
  }

  async remove(id: string, userId?: string): Promise<void> {
    const team = await this.findOne(id, userId);

    const memberRepo = this.dataSource.getRepository(TeamMemberEntity);
    const locationRepo = this.dataSource.getRepository(LocationEntity);
    const candidateRepo = this.dataSource.getRepository(CandidateEntity);
    const scoutingRubricRepo = this.dataSource.getRepository(ScoutingRubricEntity);
    const playerRepo = this.dataSource.getRepository(PlayerEntity);
    const seasonRepo = this.dataSource.getRepository(SeasonEntity);
    const eventRepo = this.dataSource.getRepository(EventEntity);
    const attendanceRepo = this.dataSource.getRepository(AttendanceEntity);
    const practiceDrillRepo = this.dataSource.getRepository(PracticeDrillEntity);
    const lineupEntryRepo = this.dataSource.getRepository(LineupEntryEntity);
    const gameEventRepo = this.dataSource.getRepository(GameEventEntity);
    const candidateAttendanceRepo = this.dataSource.getRepository(CandidateAttendanceEntity);
    const candidateEvaluationRepo = this.dataSource.getRepository(CandidateEvaluationEntity);
    const seasonPlayerRepo = this.dataSource.getRepository(SeasonPlayerEntity);
    const leagueRepo = this.dataSource.getRepository(LeagueEntity);

    // 1. Fetch seasons, candidates, players, and rubrics to clear their sub-dependencies.
    const seasons = await seasonRepo.find({ where: { teamId: id } });
    const seasonIds = seasons.map(s => s.id);

    const candidates = await candidateRepo.find({ where: { teamId: id } });
    const candidateIds = candidates.map(c => c.id);

    const players = await playerRepo.find({ where: { teamId: id } });
    const playerIds = players.map(p => p.id);

    const rubrics = await scoutingRubricRepo.find({ where: { teamId: id } });
    const rubricIds = rubrics.map(r => r.id);

    // 2. Clear candidate sub-dependencies (attendance & evaluations)
    if (candidateIds.length > 0) {
      await candidateAttendanceRepo.delete({ candidateId: In(candidateIds) });
      await candidateEvaluationRepo.delete({ candidateId: In(candidateIds) });
    }

    // 4. Clear rubric sub-dependencies (evaluations)
    if (rubricIds.length > 0) {
      await candidateEvaluationRepo.delete({ rubricId: In(rubricIds) });
    }

    // 5. Clear player sub-dependencies (season_players doesn't have cascade delete configured)
    if (playerIds.length > 0) {
      await seasonPlayerRepo.delete({ playerId: In(playerIds) });
    }

    // 6. Clear season sub-dependencies (events, leagues, season_players)
    if (seasonIds.length > 0) {
      // Find all events belonging to these seasons
      const events = await eventRepo.find({ where: { seasonId: In(seasonIds) } });
      const eventIds = events.map(e => e.id);

      if (eventIds.length > 0) {
        // Clear self-referential parent event IDs to avoid constraint violations during deletion
        await eventRepo.update({ id: In(eventIds) }, { parentEventId: null });

        // Clear event sub-dependencies
        await attendanceRepo.delete({ eventId: In(eventIds) });
        await practiceDrillRepo.delete({ eventId: In(eventIds) });
        await lineupEntryRepo.delete({ eventId: In(eventIds) });
        await gameEventRepo.delete({ eventId: In(eventIds) });
        await candidateAttendanceRepo.delete({ eventId: In(eventIds) });
        await candidateEvaluationRepo.delete({ eventId: In(eventIds) });
        
        // Now delete the events themselves
        await eventRepo.delete({ id: In(eventIds) });
      }

      // Delete season_players & leagues
      await seasonPlayerRepo.delete({ seasonId: In(seasonIds) });
      await leagueRepo.delete({ seasonId: In(seasonIds) });

      // Delete the seasons themselves
      await seasonRepo.delete({ id: In(seasonIds) });
    }

    // 7. Clear other direct dependencies of the team
    await playerRepo.delete({ teamId: id });
    await locationRepo.delete({ teamId: id });
    await candidateRepo.delete({ teamId: id });
    await scoutingRubricRepo.delete({ teamId: id });
    await memberRepo.delete({ teamId: id });

    // 8. Finally, remove the team itself
    await this.teamRepo.remove(team);
  }

  async join(userId: string, code: string): Promise<TeamEntity> {
    const team = await this.teamRepo.findOne({
      where: { joinCode: code.toUpperCase() },
      relations: ['sport'],
    });
    
    if (!team) {
      throw new NotFoundException('Invalid join code');
    }

    const existingMember = await this.memberRepo.findOne({
      where: { teamId: team.id, userId },
    });

    if (existingMember) {
      // User is already a member
      return team;
    }

    const member = this.memberRepo.create({
      teamId: team.id,
      userId,
      role: TeamRole.ASSISTANT,
    });
    await this.memberRepo.save(member);

    return team;
  }

  async regenerateCode(teamId: string): Promise<TeamEntity> {
    const team = await this.findOne(teamId);
    
    // Simple retry loop to ensure uniqueness, though 6 chars is plenty for now
    let newCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      newCode = this.joinCodeService.generate();
      const existing = await this.teamRepo.findOne({ where: { joinCode: newCode } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new ConflictException('Failed to generate unique join code');
    }

    team.joinCode = newCode!;
    return this.teamRepo.save(team);
  }

  async regenerateCalendarSecret(teamId: string): Promise<TeamEntity> {
    const team = await this.findOne(teamId);
    team.calendarSecret = nanoid();
    return this.teamRepo.save(team);
  }

  async findByCalendarSecret(secret: string): Promise<TeamEntity> {
    const team = await this.teamRepo.findOne({
      where: { calendarSecret: secret },
      relations: ['sport'],
    });
    if (!team) throw new NotFoundException('Invalid calendar secret');
    return team;
  }
}
