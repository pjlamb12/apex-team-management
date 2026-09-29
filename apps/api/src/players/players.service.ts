import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { SeasonPlayerEntity } from '../entities/season-player.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { PlayerAwardEntity } from '../entities/player-award.entity';
import { PlayerGoalEntity } from '../entities/player-goal.entity';
import { PlayerGoalNoteEntity } from '../entities/player-goal-note.entity';
import { SeasonChecklistValueEntity } from '../entities/season-checklist-value.entity';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(SeasonPlayerEntity)
    private readonly seasonPlayerRepo: Repository<SeasonPlayerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findAllForTeam(teamId: string, includeInactive = false): Promise<PlayerEntity[]> {
    const where: any = { teamId, isGuest: false };
    if (!includeInactive) {
      where.isActive = true;
    }
    return this.playerRepo.find({
      where,
      order: { jerseyNumber: 'ASC', lastName: 'ASC' },
    });
  }

  async findAllForSeason(seasonId: string, includeInactive = false): Promise<PlayerEntity[]> {
    const playerWhere: any = { isGuest: false };
    if (!includeInactive) {
      playerWhere.isActive = true;
    }
    const seasonPlayers = await this.seasonPlayerRepo.find({
      where: { seasonId, player: playerWhere },
      relations: ['player'],
    });
    return seasonPlayers
      .map(sp => sp.player)
      .filter((p): p is PlayerEntity => !!p && (includeInactive || p.isActive !== false))
      .sort((a, b) => (a.jerseyNumber ?? Infinity) - (b.jerseyNumber ?? Infinity));
  }

  async findAllForLeague(leagueId: string): Promise<PlayerEntity[]> {
    return this.playerRepo.find({
      where: { leagueId, isGuest: true, isActive: true },
      order: { jerseyNumber: 'ASC', lastName: 'ASC' },
    });
  }

  async create(teamId: string, data: CreatePlayerDto & { seasonId?: string; leagueId?: string }): Promise<PlayerEntity> {
    const isGuest = data.leagueId ? true : (data.isGuest ?? false);
    const isActive = data.isActive ?? true;
    const player = this.playerRepo.create({ 
      firstName: data.firstName,
      lastName: data.lastName,
      jerseyNumber: data.jerseyNumber,
      parentEmail: data.parentEmail,
      preferredPosition: data.preferredPosition,
      isGuest,
      isActive,
      leagueId: data.leagueId ?? null,
      teamId 
    });
    const savedPlayer = await this.playerRepo.save(player);

    if (data.seasonId && !isGuest) {
      await this.addPlayerToSeason(data.seasonId, savedPlayer.id);
    }

    return savedPlayer;
  }

  async addPlayerToSeason(seasonId: string, playerId: string): Promise<SeasonPlayerEntity> {
    const existing = await this.seasonPlayerRepo.findOne({ where: { seasonId, playerId } });
    if (existing) return existing;

    const sp = this.seasonPlayerRepo.create({ seasonId, playerId });
    return this.seasonPlayerRepo.save(sp);
  }

  async removePlayerFromSeason(seasonId: string, playerId: string): Promise<void> {
    await this.seasonPlayerRepo.delete({ seasonId, playerId });
  }

  async update(teamId: string, playerId: string, data: UpdatePlayerDto): Promise<PlayerEntity> {
    const player = await this.playerRepo.findOne({ where: { id: playerId, teamId } });
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    Object.assign(player, data);
    return this.playerRepo.save(player);
  }

  async remove(teamId: string, id: string): Promise<void> {
    const player = await this.playerRepo.findOne({ where: { id, teamId } });
    if (!player) throw new NotFoundException(`Player ${id} not found`);
    await this.playerRepo.delete({ id, teamId });
  }

  async findAllGuestsForTeam(teamId: string): Promise<PlayerEntity[]> {
    const guestMap = new Map<string, PlayerEntity>();

    // 1. Direct guest players on this team
    const teamGuests = await this.playerRepo.find({
      where: { teamId, isGuest: true },
      order: { jerseyNumber: 'ASC', lastName: 'ASC' },
    });
    for (const g of teamGuests) {
      if (g.isActive !== false) guestMap.set(g.id, g);
    }

    // 2. Guest players who participated in any event across this team's seasons
    try {
      const seasonRepo = this.dataSource.getRepository(SeasonEntity);
      const eventRepo = this.dataSource.getRepository(EventEntity);
      const seasons = await seasonRepo.find({
        where: { teamId },
        select: ['id'],
      });
      const seasonIds = seasons.map((s) => s.id);

      if (seasonIds.length > 0) {
        const events = await eventRepo.find({
          where: { seasonId: In(seasonIds) },
          select: ['id'],
        });
        const eventIds = events.map((e) => e.id);

        if (eventIds.length > 0) {
          const lineupRepo = this.dataSource.getRepository(LineupEntryEntity);
          const attendanceRepo = this.dataSource.getRepository(AttendanceEntity);

          const [lineupEntries, attendanceEntries] = await Promise.all([
            lineupRepo.find({
              where: { eventId: In(eventIds) },
              relations: ['player'],
            }),
            attendanceRepo.find({
              where: { eventId: In(eventIds) },
              relations: ['player'],
            }),
          ]);

          for (const entry of lineupEntries) {
            if (entry.player && entry.player.isGuest && entry.player.isActive !== false) {
              guestMap.set(entry.player.id, entry.player);
            }
          }

          for (const att of attendanceEntries) {
            if (att.player && att.player.isGuest && att.player.isActive !== false) {
              guestMap.set(att.player.id, att.player);
            }
          }
        }
      }
    } catch {
      // In case dataSource is unavailable or during partial transactions
    }

    return Array.from(guestMap.values()).sort(
      (a, b) => (a.jerseyNumber ?? Infinity) - (b.jerseyNumber ?? Infinity) || a.lastName.localeCompare(b.lastName)
    );
  }

  async findGuestPlayersForSeason(seasonId: string): Promise<PlayerEntity[]> {
    const guestMap = new Map<string, PlayerEntity>();

    // 1. Registered season players with isGuest: true
    const seasonPlayers = await this.seasonPlayerRepo.find({
      where: { seasonId, player: { isGuest: true, isActive: true } },
      relations: ['player'],
    });
    for (const sp of seasonPlayers) {
      if (sp.player) guestMap.set(sp.player.id, sp.player);
    }

    // 2. Guest players who have lineup entries or attendance in events of this season
    try {
      const eventRepo = this.dataSource.getRepository(EventEntity);
      const events = await eventRepo.find({
        where: { seasonId },
        select: ['id'],
      });
      const eventIds = events.map((e) => e.id);

      if (eventIds.length > 0) {
        const lineupRepo = this.dataSource.getRepository(LineupEntryEntity);
        const attendanceRepo = this.dataSource.getRepository(AttendanceEntity);

        const [lineupEntries, attendanceEntries] = await Promise.all([
          lineupRepo.find({
            where: { eventId: In(eventIds) },
            relations: ['player'],
          }),
          attendanceRepo.find({
            where: { eventId: In(eventIds) },
            relations: ['player'],
          }),
        ]);

        for (const entry of lineupEntries) {
          if (entry.player && entry.player.isGuest && entry.player.isActive !== false) {
            guestMap.set(entry.player.id, entry.player);
          }
        }

        for (const att of attendanceEntries) {
          if (att.player && att.player.isGuest && att.player.isActive !== false) {
            guestMap.set(att.player.id, att.player);
          }
        }
      }
    } catch {
      // In case dataSource is unavailable or during partial transactions
    }

    return Array.from(guestMap.values()).sort(
      (a, b) => (a.jerseyNumber ?? Infinity) - (b.jerseyNumber ?? Infinity) || a.lastName.localeCompare(b.lastName)
    );
  }

  async mergePlayers(teamId: string, targetPlayerId: string, sourcePlayerId: string): Promise<PlayerEntity> {
    if (targetPlayerId === sourcePlayerId) {
      throw new BadRequestException('Target player and source player cannot be the same');
    }

    return this.dataSource.transaction(async (manager) => {
      const targetPlayer = await manager.findOne(PlayerEntity, {
        where: { id: targetPlayerId, teamId },
      });
      if (!targetPlayer) {
        throw new NotFoundException(`Target player ${targetPlayerId} not found in team ${teamId}`);
      }

      const sourcePlayer = await manager.findOne(PlayerEntity, {
        where: { id: sourcePlayerId, teamId },
      });
      if (!sourcePlayer) {
        throw new NotFoundException(`Source player ${sourcePlayerId} not found in team ${teamId}`);
      }

      // 1. Relink attendance records
      const sourceAttendance = await manager.find(AttendanceEntity, {
        where: { playerId: sourcePlayerId },
      });
      for (const record of sourceAttendance) {
        const targetAttendance = await manager.findOne(AttendanceEntity, {
          where: { eventId: record.eventId, playerId: targetPlayerId },
        });
        if (targetAttendance) {
          if (
            (record.status === 'present' || record.status === 'tardy') &&
            targetAttendance.status !== 'present'
          ) {
            targetAttendance.status = record.status;
            await manager.save(targetAttendance);
          }
          await manager.delete(AttendanceEntity, { id: record.id });
        } else {
          record.playerId = targetPlayerId;
          await manager.save(record);
        }
      }

      // 2. Relink lineup entries
      const sourceLineup = await manager.find(LineupEntryEntity, {
        where: { playerId: sourcePlayerId },
      });
      for (const entry of sourceLineup) {
        const targetLineup = await manager.findOne(LineupEntryEntity, {
          where: { eventId: entry.eventId, playerId: targetPlayerId },
        });
        if (targetLineup) {
          await manager.delete(LineupEntryEntity, { id: entry.id });
        } else {
          entry.playerId = targetPlayerId;
          await manager.save(entry);
        }
      }

      // 3. Relink game events (JSONB payload references)
      const allGameEvents = await manager.find(GameEventEntity);
      for (const ge of allGameEvents) {
        let changed = false;
        const payload = { ...(ge.payload as Record<string, any>) };
        for (const [key, val] of Object.entries(payload)) {
          if (val === sourcePlayerId) {
            payload[key] = targetPlayerId;
            changed = true;
          } else if (Array.isArray(val) && val.includes(sourcePlayerId)) {
            payload[key] = val.map((v) => (v === sourcePlayerId ? targetPlayerId : v));
            changed = true;
          }
        }
        if (changed) {
          ge.payload = payload;
          await manager.save(ge);
        }
      }

      // 4. Relink season players
      const sourceSeasonPlayers = await manager.find(SeasonPlayerEntity, {
        where: { playerId: sourcePlayerId },
      });
      for (const sp of sourceSeasonPlayers) {
        const targetSp = await manager.findOne(SeasonPlayerEntity, {
          where: { seasonId: sp.seasonId, playerId: targetPlayerId },
        });
        if (targetSp) {
          await manager.delete(SeasonPlayerEntity, { id: sp.id });
        } else {
          sp.playerId = targetPlayerId;
          await manager.save(sp);
        }
      }

      // 5. Relink awards
      await manager.update(PlayerAwardEntity, { playerId: sourcePlayerId }, { playerId: targetPlayerId });

      // 6. Relink player goals and notes
      await manager.update(PlayerGoalEntity, { playerId: sourcePlayerId }, { playerId: targetPlayerId });
      await manager.update(PlayerGoalNoteEntity, { playerId: sourcePlayerId }, { playerId: targetPlayerId });

      // 7. Relink checklist values
      const sourceChecklist = await manager.find(SeasonChecklistValueEntity, {
        where: { playerId: sourcePlayerId },
      });
      for (const sc of sourceChecklist) {
        const targetSc = await manager.findOne(SeasonChecklistValueEntity, {
          where: { itemId: sc.itemId, playerId: targetPlayerId },
        });
        if (targetSc) {
          await manager.delete(SeasonChecklistValueEntity, { id: sc.id });
        } else {
          sc.playerId = targetPlayerId;
          await manager.save(sc);
        }
      }

      // 8. Consolidate profile attributes if target was missing them
      if (!targetPlayer.jerseyNumber && sourcePlayer.jerseyNumber) {
        targetPlayer.jerseyNumber = sourcePlayer.jerseyNumber;
      }
      if (!targetPlayer.preferredPosition && sourcePlayer.preferredPosition) {
        targetPlayer.preferredPosition = sourcePlayer.preferredPosition;
      }
      if (!targetPlayer.parentEmail && sourcePlayer.parentEmail) {
        targetPlayer.parentEmail = sourcePlayer.parentEmail;
      }
      if (!targetPlayer.leagueId && sourcePlayer.leagueId) {
        targetPlayer.leagueId = sourcePlayer.leagueId;
      }

      const updatedTarget = await manager.save(targetPlayer);

      // 9. Delete duplicate source player
      await manager.delete(PlayerEntity, { id: sourcePlayerId });

      return updatedTarget;
    });
  }
}

