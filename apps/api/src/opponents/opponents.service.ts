import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { OpponentEntity } from '../entities/opponent.entity';
import { EventEntity } from '../entities/event.entity';
import { TeamEntity } from '../entities/team.entity';
import { CreateOpponentDto } from './dto/create-opponent.dto';
import { UpdateOpponentDto } from './dto/update-opponent.dto';
import { CreateScoutingNoteDto } from './dto/create-scouting-note.dto';
import {
  OpponentWithStats,
  OpponentHeadToHeadStats,
  OpponentMatchHistoryItem,
  DangerPlayer,
  OpponentScoutingNote,
} from '@apex-team/shared/util/models';

@Injectable()
export class OpponentsService {
  constructor(
    @InjectRepository(OpponentEntity)
    private readonly opponentRepo: Repository<OpponentEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
  ) {}

  private calculateH2H(events: EventEntity[]): OpponentHeadToHeadStats {
    const completedMatches = events.filter((e) => e.status === 'completed' || (e.goalsFor !== null && e.goalsFor !== undefined));

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;

    const homeRecord = { wins: 0, draws: 0, losses: 0, total: 0 };
    const awayRecord = { wins: 0, draws: 0, losses: 0, total: 0 };

    for (const match of completedMatches) {
      const gf = match.goalsFor ?? 0;
      const ga = match.goalsAgainst ?? 0;
      goalsFor += gf;
      goalsAgainst += ga;

      if (ga === 0) {
        cleanSheets++;
      }

      const isWin = gf > ga;
      const isDraw = gf === ga;
      const isLoss = gf < ga;

      if (isWin) wins++;
      else if (isDraw) draws++;
      else if (isLoss) losses++;

      if (match.isHomeGame) {
        homeRecord.total++;
        if (isWin) homeRecord.wins++;
        else if (isDraw) homeRecord.draws++;
        else if (isLoss) homeRecord.losses++;
      } else {
        awayRecord.total++;
        if (isWin) awayRecord.wins++;
        else if (isDraw) awayRecord.draws++;
        else if (isLoss) awayRecord.losses++;
      }
    }

    const totalGames = completedMatches.length;
    const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const goalDifference = goalsFor - goalsAgainst;
    const avgGoalsFor = totalGames > 0 ? Number((goalsFor / totalGames).toFixed(1)) : 0;
    const avgGoalsAgainst = totalGames > 0 ? Number((goalsAgainst / totalGames).toFixed(1)) : 0;

    const latestEvent = events.length > 0 ? events[0] : null;
    const lastPlayedDate = latestEvent ? (latestEvent.scheduledAt ? new Date(latestEvent.scheduledAt).toISOString() : null) : null;

    return {
      totalGames,
      wins,
      draws,
      losses,
      winPercentage,
      goalsFor,
      goalsAgainst,
      goalDifference,
      avgGoalsFor,
      avgGoalsAgainst,
      cleanSheets,
      homeRecord,
      awayRecord,
      lastPlayedDate,
    };
  }

  async findAllForTeam(
    teamId: string,
    query?: { search?: string; threatLevel?: string },
  ): Promise<OpponentWithStats[]> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    let qb = this.opponentRepo
      .createQueryBuilder('opponent')
      .where('opponent.team_id = :teamId', { teamId });

    if (query?.search && query.search.trim()) {
      qb = qb.andWhere('LOWER(opponent.name) LIKE LOWER(:search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    if (query?.threatLevel && query.threatLevel !== 'all') {
      qb = qb.andWhere('opponent.threat_level = :threatLevel', {
        threatLevel: query.threatLevel,
      });
    }

    qb = qb.orderBy('opponent.name', 'ASC');

    const opponents = await qb.getMany();

    // Fetch all games for this team's seasons
    const events = await this.eventRepo
      .createQueryBuilder('event')
      .innerJoin('event.season', 'season')
      .leftJoinAndSelect('event.league', 'league')
      .where('season.team_id = :teamId', { teamId })
      .andWhere('event.type = :type', { type: 'game' })
      .orderBy('event.scheduled_at', 'DESC')
      .getMany();

    return opponents.map((opp) => {
      const oppEvents = events.filter(
        (e) => e.opponentId === opp.id || (e.opponent && e.opponent.trim().toLowerCase() === opp.name.trim().toLowerCase()),
      );
      const headToHead = this.calculateH2H(oppEvents);
      return {
        id: opp.id,
        teamId: opp.teamId,
        name: opp.name,
        coachName: opp.coachName,
        contactInfo: opp.contactInfo,
        primaryColor: opp.primaryColor,
        secondaryColor: opp.secondaryColor,
        formation: opp.formation,
        threatLevel: opp.threatLevel,
        notes: opp.notes,
        tendencies: opp.tendencies,
        dangerPlayers: opp.dangerPlayers || [],
        scoutingNotes: opp.scoutingNotes || [],
        createdAt: opp.createdAt ? opp.createdAt.toISOString() : undefined,
        updatedAt: opp.updatedAt ? opp.updatedAt.toISOString() : undefined,
        headToHead,
      };
    });
  }

  async findOne(teamId: string, opponentId: string): Promise<OpponentWithStats> {
    const opponent = await this.opponentRepo.findOne({
      where: { id: opponentId, teamId },
    });

    if (!opponent) {
      throw new NotFoundException('Opponent not found');
    }

    // Fetch matches with relations
    const events = await this.eventRepo
      .createQueryBuilder('event')
      .innerJoinAndSelect('event.season', 'season')
      .leftJoinAndSelect('event.league', 'league')
      .leftJoinAndSelect('event.notesList', 'notesList')
      .leftJoinAndSelect('notesList.user', 'noteUser')
      .where('season.team_id = :teamId', { teamId })
      .andWhere('event.type = :type', { type: 'game' })
      .andWhere('(event.opponent_id = :opponentId OR LOWER(TRIM(event.opponent)) = LOWER(TRIM(:oppName)))', {
        opponentId,
        oppName: opponent.name,
      })
      .orderBy('event.scheduled_at', 'DESC')
      .getMany();

    const headToHead = this.calculateH2H(events);

    const recentMatches: OpponentMatchHistoryItem[] = events.map((event) => {
      let result: 'win' | 'draw' | 'loss' | 'upcoming' = 'upcoming';
      if (event.status === 'completed' || (event.goalsFor !== null && event.goalsFor !== undefined)) {
        const gf = event.goalsFor ?? 0;
        const ga = event.goalsAgainst ?? 0;
        if (gf > ga) result = 'win';
        else if (gf === ga) result = 'draw';
        else result = 'loss';
      }

      return {
        id: event.id,
        scheduledAt: event.scheduledAt ? new Date(event.scheduledAt).toISOString() : '',
        isHomeGame: event.isHomeGame,
        location: event.location,
        goalsFor: event.goalsFor,
        goalsAgainst: event.goalsAgainst,
        result,
        status: event.status,
        seasonName: event.season?.name,
        leagueName: event.league?.name,
        notes: event.notes,
        eventNotes: event.notesList?.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : '',
          authorName: n.user?.displayName,
        })),
      };
    });

    return {
      id: opponent.id,
      teamId: opponent.teamId,
      name: opponent.name,
      coachName: opponent.coachName,
      contactInfo: opponent.contactInfo,
      primaryColor: opponent.primaryColor,
      secondaryColor: opponent.secondaryColor,
      formation: opponent.formation,
      threatLevel: opponent.threatLevel,
      notes: opponent.notes,
      tendencies: opponent.tendencies,
      dangerPlayers: opponent.dangerPlayers || [],
      scoutingNotes: opponent.scoutingNotes || [],
      createdAt: opponent.createdAt ? opponent.createdAt.toISOString() : undefined,
      updatedAt: opponent.updatedAt ? opponent.updatedAt.toISOString() : undefined,
      headToHead,
      recentMatches,
    };
  }

  async create(teamId: string, dto: CreateOpponentDto): Promise<OpponentEntity> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const dangerPlayers: DangerPlayer[] = (dto.dangerPlayers || []).map((dp) => ({
      ...dp,
      id: dp.id || randomUUID(),
    }));

    const opponent = this.opponentRepo.create({
      ...dto,
      teamId,
      dangerPlayers,
      scoutingNotes: [],
    });

    const saved = await this.opponentRepo.save(opponent);

    // Auto-link any existing events for this team that have matching opponent name
    await this.eventRepo
      .createQueryBuilder()
      .update(EventEntity)
      .set({ opponentId: saved.id })
      .where('season_id IN (SELECT id FROM seasons WHERE team_id = :teamId)', { teamId })
      .andWhere('LOWER(TRIM(opponent)) = LOWER(TRIM(:oppName))', { oppName: saved.name })
      .andWhere('opponent_id IS NULL')
      .execute();

    return saved;
  }

  async update(teamId: string, opponentId: string, dto: UpdateOpponentDto): Promise<OpponentEntity> {
    const opponent = await this.opponentRepo.findOne({
      where: { id: opponentId, teamId },
    });

    if (!opponent) {
      throw new NotFoundException('Opponent not found');
    }

    if (dto.dangerPlayers) {
      opponent.dangerPlayers = dto.dangerPlayers.map((dp) => ({
        ...dp,
        id: dp.id || randomUUID(),
      }));
    }

    if (dto.name !== undefined) opponent.name = dto.name;
    if (dto.coachName !== undefined) opponent.coachName = dto.coachName;
    if (dto.contactInfo !== undefined) opponent.contactInfo = dto.contactInfo;
    if (dto.primaryColor !== undefined) opponent.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) opponent.secondaryColor = dto.secondaryColor;
    if (dto.formation !== undefined) opponent.formation = dto.formation;
    if (dto.threatLevel !== undefined) opponent.threatLevel = dto.threatLevel;
    if (dto.notes !== undefined) opponent.notes = dto.notes;
    if (dto.tendencies !== undefined) opponent.tendencies = dto.tendencies;

    const saved = await this.opponentRepo.save(opponent);

    // If name changed, update linked events where opponent text matches
    if (dto.name) {
      await this.eventRepo
        .createQueryBuilder()
        .update(EventEntity)
        .set({ opponent: dto.name })
        .where('opponent_id = :opponentId', { opponentId })
        .execute();
    }

    return saved;
  }

  async remove(teamId: string, opponentId: string): Promise<void> {
    const opponent = await this.opponentRepo.findOne({
      where: { id: opponentId, teamId },
    });

    if (!opponent) {
      throw new NotFoundException('Opponent not found');
    }

    await this.opponentRepo.remove(opponent);
  }

  async addScoutingNote(
    teamId: string,
    opponentId: string,
    authorName: string,
    dto: CreateScoutingNoteDto,
  ): Promise<OpponentScoutingNote> {
    const opponent = await this.opponentRepo.findOne({
      where: { id: opponentId, teamId },
    });

    if (!opponent) {
      throw new NotFoundException('Opponent not found');
    }

    const note: OpponentScoutingNote = {
      id: randomUUID(),
      date: new Date().toISOString(),
      authorName,
      content: dto.content,
      tags: dto.tags || [],
    };

    const notes = opponent.scoutingNotes || [];
    notes.unshift(note);
    opponent.scoutingNotes = notes;

    await this.opponentRepo.save(opponent);
    return note;
  }

  async deleteScoutingNote(teamId: string, opponentId: string, noteId: string): Promise<void> {
    const opponent = await this.opponentRepo.findOne({
      where: { id: opponentId, teamId },
    });

    if (!opponent) {
      throw new NotFoundException('Opponent not found');
    }

    opponent.scoutingNotes = (opponent.scoutingNotes || []).filter((n) => n.id !== noteId);
    await this.opponentRepo.save(opponent);
  }

  async findOrCreateByName(teamId: string, name: string): Promise<OpponentEntity> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Opponent name is required');
    }

    let opponent = await this.opponentRepo
      .createQueryBuilder('opp')
      .where('opp.team_id = :teamId', { teamId })
      .andWhere('LOWER(TRIM(opp.name)) = LOWER(TRIM(:name))', { name: trimmed })
      .getOne();

    if (!opponent) {
      opponent = this.opponentRepo.create({
        teamId,
        name: trimmed,
        threatLevel: 'medium',
        dangerPlayers: [],
        scoutingNotes: [],
      });
      opponent = await this.opponentRepo.save(opponent);
    }

    return opponent;
  }
}
