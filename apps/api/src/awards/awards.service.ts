import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerAwardEntity } from '../entities/player-award.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { CreateAwardDto } from './dto/create-award.dto';
import { TeamAwardsSummary } from '@apex-team/shared/util/models';

@Injectable()
export class AwardsService {
  constructor(
    @InjectRepository(PlayerAwardEntity)
    private readonly awardRepo: Repository<PlayerAwardEntity>,
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
      eventId?: string;
      category?: string;
    },
  ): Promise<PlayerAwardEntity[]> {
    const qb = this.awardRepo
      .createQueryBuilder('award')
      .leftJoinAndSelect('award.player', 'player')
      .leftJoinAndSelect('award.event', 'event')
      .where('award.team_id = :teamId', { teamId });

    if (filters?.seasonId) {
      qb.andWhere('award.season_id = :seasonId', { seasonId: filters.seasonId });
    }

    if (filters?.playerId) {
      qb.andWhere('award.player_id = :playerId', { playerId: filters.playerId });
    }

    if (filters?.eventId) {
      qb.andWhere('award.event_id = :eventId', { eventId: filters.eventId });
    }

    if (filters?.category) {
      qb.andWhere('award.category = :category', { category: filters.category });
    }

    qb.orderBy('award.awarded_at', 'DESC');

    return qb.getMany();
  }

  async findByPlayer(teamId: string, playerId: string): Promise<PlayerAwardEntity[]> {
    return this.awardRepo.find({
      where: { teamId, playerId },
      relations: ['event', 'player'],
      order: { awardedAt: 'DESC' },
    });
  }

  async findByEvent(teamId: string, eventId: string): Promise<PlayerAwardEntity[]> {
    return this.awardRepo.find({
      where: { teamId, eventId },
      relations: ['player'],
      order: { awardedAt: 'DESC' },
    });
  }

  async getSummary(teamId: string, seasonId?: string): Promise<TeamAwardsSummary> {
    // 1. Fetch team players
    const players = await this.playerRepo.find({
      where: { teamId, isActive: true },
      order: { jerseyNumber: 'ASC', lastName: 'ASC', firstName: 'ASC' },
    });

    // 2. Fetch all awards for the team (and optional season)
    const awards = await this.findAll(teamId, { seasonId });

    const totalAwards = awards.length;

    // 3. Category distribution
    const awardsByCategory: Record<string, number> = {};
    const playerAwardMap = new Map<
      string,
      { count: number; lastDate?: string; badges: Set<string> }
    >();

    // Initialize all active players with 0 awards so coaches can easily spot unrecognized kids
    players.forEach((p) => {
      playerAwardMap.set(p.id, { count: 0, badges: new Set<string>() });
    });

    awards.forEach((award) => {
      // Category count
      awardsByCategory[award.category] = (awardsByCategory[award.category] || 0) + 1;

      // Player count
      let pEntry = playerAwardMap.get(award.playerId);
      if (!pEntry) {
        pEntry = { count: 0, badges: new Set<string>() };
        playerAwardMap.set(award.playerId, pEntry);
      }
      pEntry.count += 1;
      pEntry.badges.add(award.badgeType);

      const awardDate = award.awardedAt.toISOString();
      if (!pEntry.lastDate || awardDate > pEntry.lastDate) {
        pEntry.lastDate = awardDate;
      }
    });

    const playerAwardCounts = players.map((p) => {
      const entry = playerAwardMap.get(p.id) || { count: 0, badges: new Set<string>() };
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber,
        preferredPosition: p.preferredPosition,
        awardCount: entry.count,
        lastAwardDate: entry.lastDate,
        badges: Array.from(entry.badges),
      };
    });

    // Sort playerAwardCounts by awardCount DESC, then firstName ASC
    playerAwardCounts.sort((a, b) => b.awardCount - a.awardCount || a.firstName.localeCompare(b.firstName));

    const recentAwards = awards.slice(0, 10).map((a) => ({
      id: a.id,
      teamId: a.teamId,
      playerId: a.playerId,
      eventId: a.eventId,
      seasonId: a.seasonId,
      badgeType: a.badgeType,
      title: a.title,
      category: a.category as any,
      icon: a.icon,
      color: a.color,
      notes: a.notes,
      awardedAt: a.awardedAt.toISOString(),
      player: a.player
        ? {
            id: a.player.id,
            firstName: a.player.firstName,
            lastName: a.player.lastName,
            jerseyNumber: a.player.jerseyNumber,
            preferredPosition: a.player.preferredPosition,
          }
        : undefined,
      event: a.event
        ? {
            id: a.event.id,
            type: a.event.type,
            opponent: a.event.opponent,
            scheduledAt: a.event.scheduledAt?.toISOString(),
          }
        : undefined,
    }));

    return {
      totalAwards,
      awardsByCategory,
      playerAwardCounts,
      recentAwards,
    };
  }

  async create(teamId: string, dto: CreateAwardDto): Promise<PlayerAwardEntity> {
    const player = await this.playerRepo.findOne({
      where: { id: dto.playerId, teamId },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${dto.playerId}" not found on this team.`);
    }

    let seasonId = dto.seasonId;
    let event: EventEntity | null = null;

    if (dto.eventId) {
      event = await this.eventRepo.findOne({
        where: { id: dto.eventId },
      });
      if (event && !seasonId && event.seasonId) {
        seasonId = event.seasonId;
      }
    }

    const award = this.awardRepo.create({
      teamId,
      playerId: dto.playerId,
      eventId: dto.eventId || null,
      seasonId: seasonId || null,
      badgeType: dto.badgeType,
      title: dto.title,
      category: dto.category,
      icon: dto.icon,
      color: dto.color,
      notes: dto.notes || null,
      awardedAt: new Date(),
    });

    const saved = await this.awardRepo.save(award);
    saved.player = player;
    if (event) {
      saved.event = event;
    }
    return saved;
  }

  async createBatch(teamId: string, dtos: CreateAwardDto[]): Promise<PlayerAwardEntity[]> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('No awards provided to create.');
    }

    const created: PlayerAwardEntity[] = [];
    for (const dto of dtos) {
      const award = await this.create(teamId, dto);
      created.push(award);
    }
    return created;
  }

  async delete(teamId: string, awardId: string): Promise<void> {
    const award = await this.awardRepo.findOne({
      where: { id: awardId, teamId },
    });

    if (!award) {
      throw new NotFoundException(`Award with ID "${awardId}" not found.`);
    }

    await this.awardRepo.remove(award);
  }
}
