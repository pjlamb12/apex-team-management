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

  async seedDemo(userId: string): Promise<TeamEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Find the sport "Soccer"
      const sport = await manager.findOne(SportEntity, {
        where: { name: 'Soccer' },
      });
      if (!sport) {
        throw new NotFoundException('Soccer sport not found');
      }

      // 2. Create the team
      const team = manager.create(TeamEntity, {
        name: 'Apex Rangers FC (Demo)',
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
        name: 'Apex Sports Complex - Pitch 1',
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
        defaultPracticeLocation: 'Apex Sports Complex - Pitch 1',
      });
      const savedSeason = await manager.save(SeasonEntity, season);

      // 6. Create a league
      const league = manager.create(LeagueEntity, {
        seasonId: savedSeason.id,
        name: 'Utah Metro Soccer League - U12',
        type: 'league',
        isActive: true,
        playersOnField: 9,
        periodCount: 2,
        periodLengthMinutes: 30,
        defaultHomeVenue: 'Apex Sports Complex - Pitch 1',
        defaultHomeColor: 'Red',
        defaultAwayColor: 'White',
        homeLocationId: savedLocation.id,
      });
      const savedLeague = await manager.save(LeagueEntity, league);

      // 7. Create players
      const playerSpecs = [
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
        opponent: 'Thunder FC',
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        location: 'Thunder FC Field',
        isHomeGame: false,
        status: 'completed',
        goalsFor: 3,
        goalsAgainst: 1,
        periodCount: 2,
        periodLengthMinutes: 30,
        playersOnField: 9,
        currentPeriod: 2,
      });
      const savedPastGame = await manager.save(EventEntity, pastGame);

      // Attendance for past game
      for (const player of savedPlayers) {
        const isInjured = player.firstName === 'Cristiano' && player.lastName === 'Ronaldo';
        const attendance = manager.create(AttendanceEntity, {
          eventId: savedPastGame.id,
          playerId: player.id,
          status: isInjured ? 'injured' : 'present',
          notes: isInjured ? 'Slight hamstring strain' : null,
        });
        await manager.save(AttendanceEntity, attendance);
      }

      // Lineup entries for past game
      const startingLineup = [
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


      // 8.2 Scheduled Game (4 days in future)
      const futureGame = manager.create(EventEntity, {
        seasonId: savedSeason.id,
        leagueId: savedLeague.id,
        type: 'game',
        opponent: 'Lightning SC',
        scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        location: 'Apex Sports Complex - Pitch 1',
        locationId: savedLocation.id,
        isHomeGame: true,
        status: 'scheduled',
        periodCount: 2,
        periodLengthMinutes: 30,
        playersOnField: 9,
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
        location: 'Apex Sports Complex - Pitch 1',
        locationId: savedLocation.id,
        status: 'scheduled',
      });
      const savedFuturePractice = await manager.save(EventEntity, futurePractice);

      // Practice drills
      const practiceDrill1 = manager.create(PracticeDrillEntity, {
        eventId: savedFuturePractice.id,
        drillId: null,
        customName: 'Rondo (5v2 Warmup)',
        sequence: 1,
        durationMinutes: 15,
        notes: 'Focus on quick, 1-touch passing and moving to open space.',
      });
      await manager.save(PracticeDrillEntity, practiceDrill1);

      const practiceDrill2 = manager.create(PracticeDrillEntity, {
        eventId: savedFuturePractice.id,
        drillId: null,
        customName: 'Shooting on Crosses',
        sequence: 2,
        durationMinutes: 25,
        notes: 'Winger crosses from deep, attacking midfielders and strikers timing their runs into the box.',
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
