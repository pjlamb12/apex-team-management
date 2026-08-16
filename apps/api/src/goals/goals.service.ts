import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerGoalEntity } from '../entities/player-goal.entity';
import { PlayerGoalNoteEntity } from '../entities/player-goal-note.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateGoalNoteDto } from './dto/create-goal-note.dto';
import {
  GoalCategory,
  GoalMasteryStage,
  TeamGoalsSummary,
} from '@apex-team/shared/util/models';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(PlayerGoalEntity)
    private readonly goalRepo: Repository<PlayerGoalEntity>,
    @InjectRepository(PlayerGoalNoteEntity)
    private readonly noteRepo: Repository<PlayerGoalNoteEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
  ) {}

  async findAll(
    teamId: string,
    filters?: {
      seasonId?: string;
      playerId?: string;
      category?: string;
      status?: string;
    },
  ): Promise<PlayerGoalEntity[]> {
    const qb = this.goalRepo
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.player', 'player')
      .leftJoinAndSelect('goal.notes', 'notes')
      .leftJoinAndSelect('notes.event', 'event')
      .where('goal.team_id = :teamId', { teamId });

    if (filters?.seasonId) {
      qb.andWhere('goal.season_id = :seasonId', { seasonId: filters.seasonId });
    }

    if (filters?.playerId) {
      qb.andWhere('goal.player_id = :playerId', { playerId: filters.playerId });
    }

    if (filters?.category) {
      qb.andWhere('goal.category = :category', { category: filters.category });
    }

    if (filters?.status) {
      qb.andWhere('goal.status = :status', { status: filters.status });
    }

    qb.orderBy('goal.created_at', 'DESC');
    qb.addOrderBy('notes.observed_at', 'DESC');

    return qb.getMany();
  }

  async findByPlayer(
    teamId: string,
    playerId: string,
    seasonId?: string,
  ): Promise<PlayerGoalEntity[]> {
    const qb = this.goalRepo
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.player', 'player')
      .leftJoinAndSelect('goal.notes', 'notes')
      .leftJoinAndSelect('notes.event', 'event')
      .where('goal.team_id = :teamId', { teamId })
      .andWhere('goal.player_id = :playerId', { playerId });

    if (seasonId) {
      qb.andWhere('goal.season_id = :seasonId', { seasonId });
    }

    qb.orderBy('goal.created_at', 'DESC');
    qb.addOrderBy('notes.observed_at', 'DESC');

    return qb.getMany();
  }

  async findOne(teamId: string, goalId: string): Promise<PlayerGoalEntity> {
    const goal = await this.goalRepo.findOne({
      where: { id: goalId, teamId },
      relations: ['player', 'notes', 'notes.event'],
      order: {
        notes: {
          observedAt: 'DESC',
        },
      },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID "${goalId}" not found for this team.`);
    }

    return goal;
  }

  async create(teamId: string, playerId: string, dto: CreateGoalDto): Promise<PlayerGoalEntity> {
    const player = await this.playerRepo.findOne({
      where: { id: playerId, teamId },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${playerId}" not found on this team.`);
    }

    const goal = this.goalRepo.create({
      teamId,
      playerId,
      seasonId: dto.seasonId || null,
      title: dto.title.trim(),
      category: dto.category,
      status: 'in_progress',
      masteryStage: dto.masteryStage || 'emerging',
      timeframe: dto.timeframe || 'full_season',
      targetDate: dto.targetDate || null,
      description: dto.description?.trim() || null,
      baselineAssessment: dto.baselineAssessment?.trim() || null,
    });

    const saved = await this.goalRepo.save(goal);
    return this.findOne(teamId, saved.id);
  }

  async update(teamId: string, goalId: string, dto: UpdateGoalDto): Promise<PlayerGoalEntity> {
    const goal = await this.findOne(teamId, goalId);

    if (dto.title !== undefined) goal.title = dto.title.trim();
    if (dto.category !== undefined) goal.category = dto.category;
    if (dto.status !== undefined) goal.status = dto.status;
    if (dto.masteryStage !== undefined) {
      goal.masteryStage = dto.masteryStage;
      if (dto.masteryStage === 'mastered' && !dto.status) {
        goal.status = 'mastered';
      }
    }
    if (dto.timeframe !== undefined) goal.timeframe = dto.timeframe;
    if (dto.targetDate !== undefined) goal.targetDate = dto.targetDate || null;
    if (dto.description !== undefined) goal.description = dto.description?.trim() || null;
    if (dto.baselineAssessment !== undefined) {
      goal.baselineAssessment = dto.baselineAssessment?.trim() || null;
    }

    await this.goalRepo.save(goal);
    return this.findOne(teamId, goal.id);
  }

  async remove(teamId: string, goalId: string): Promise<{ success: boolean; id: string }> {
    const goal = await this.findOne(teamId, goalId);
    await this.goalRepo.remove(goal);
    return { success: true, id: goalId };
  }

  async addNote(
    teamId: string,
    goalId: string,
    dto: CreateGoalNoteDto,
  ): Promise<PlayerGoalNoteEntity> {
    const goal = await this.findOne(teamId, goalId);

    if (dto.eventId) {
      const event = await this.eventRepo.findOne({
        where: { id: dto.eventId },
      });
      if (!event) {
        throw new NotFoundException(`Event with ID "${dto.eventId}" not found.`);
      }
    }

    const note = this.noteRepo.create({
      goalId,
      teamId,
      playerId: goal.playerId,
      eventId: dto.eventId || null,
      stage: dto.stage || null,
      note: dto.note.trim(),
      observedAt: dto.observedAt ? new Date(dto.observedAt) : new Date(),
    });

    const saved = await this.noteRepo.save(note);

    // If a stage was specified, update goal's masteryStage
    if (dto.stage) {
      goal.masteryStage = dto.stage;
      if (dto.stage === 'mastered') {
        goal.status = 'mastered';
      }
      await this.goalRepo.save(goal);
    }

    const reloaded = await this.noteRepo.findOne({
      where: { id: saved.id },
      relations: ['event'],
    });

    return reloaded || saved;
  }

  async removeNote(
    teamId: string,
    goalId: string,
    noteId: string,
  ): Promise<{ success: boolean; id: string }> {
    await this.findOne(teamId, goalId);

    const note = await this.noteRepo.findOne({
      where: { id: noteId, goalId, teamId },
    });

    if (!note) {
      throw new NotFoundException(`Goal note with ID "${noteId}" not found.`);
    }

    await this.noteRepo.remove(note);
    return { success: true, id: noteId };
  }

  async getSummary(teamId: string, seasonId?: string): Promise<TeamGoalsSummary> {
    const players = await this.playerRepo.find({
      where: { teamId, isActive: true },
      order: { jerseyNumber: 'ASC', lastName: 'ASC', firstName: 'ASC' },
    });

    const goals = await this.findAll(teamId, { seasonId });

    const totalGoals = goals.length;
    let activeGoals = 0;
    let masteredGoals = 0;

    const goalsByCategory: Record<GoalCategory, number> = {
      technical: 0,
      tactical: 0,
      physical: 0,
      mental: 0,
      positional: 0,
      general: 0,
    };

    const goalsByStage: Record<GoalMasteryStage, number> = {
      emerging: 0,
      developing: 0,
      mastered: 0,
    };

    const playerGoalsMap = new Map<
      string,
      { total: number; mastered: number }
    >();

    players.forEach((p) => {
      playerGoalsMap.set(p.id, { total: 0, mastered: 0 });
    });

    goals.forEach((g) => {
      if (g.status === 'in_progress') activeGoals++;
      if (g.status === 'mastered' || g.masteryStage === 'mastered') masteredGoals++;

      if (g.category in goalsByCategory) {
        goalsByCategory[g.category as GoalCategory]++;
      }
      if (g.masteryStage in goalsByStage) {
        goalsByStage[g.masteryStage as GoalMasteryStage]++;
      }

      const current = playerGoalsMap.get(g.playerId) || { total: 0, mastered: 0 };
      current.total++;
      if (g.masteryStage === 'mastered' || g.status === 'mastered') {
        current.mastered++;
      }
      playerGoalsMap.set(g.playerId, current);
    });

    const playerGoalsCount = players.map((p) => {
      const stats = playerGoalsMap.get(p.id) || { total: 0, mastered: 0 };
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber,
        totalGoals: stats.total,
        masteredGoals: stats.mastered,
      };
    });

    return {
      totalGoals,
      activeGoals,
      masteredGoals,
      goalsByCategory,
      goalsByStage,
      playerGoalsCount,
    };
  }
}
