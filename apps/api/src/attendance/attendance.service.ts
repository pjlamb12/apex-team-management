import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AttendanceEntity } from '../entities/attendance.entity';
import { EventEntity } from '../entities/event.entity';
import { PlayerEntity } from '../entities/player.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { UpdateAttendanceDto, BatchUpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
  ) {}

  async findAllForEvent(eventId: string): Promise<AttendanceEntity[]> {
    return this.attendanceRepo.find({
      where: { eventId },
      relations: ['player'],
    });
  }

  async update(eventId: string, dto: UpdateAttendanceDto): Promise<AttendanceEntity> {
    let attendance = await this.attendanceRepo.findOne({
      where: { eventId, playerId: dto.playerId },
    });

    if (!attendance) {
      attendance = this.attendanceRepo.create({
        eventId,
        playerId: dto.playerId,
        status: dto.status,
        notes: dto.notes,
      });
    } else {
      attendance.status = dto.status;
      if (dto.notes !== undefined) {
        attendance.notes = dto.notes;
      }
    }

    return this.attendanceRepo.save(attendance);
  }

  async batchUpdate(eventId: string, dto: BatchUpdateAttendanceDto): Promise<void> {
    const event = await this.eventRepo.findOne({ where: { id: eventId }, relations: ['season'] });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    let playerIds = dto.playerIds;
    if (!playerIds) {
      // If no playerIds provided, update all players for the team
      const players = await this.playerRepo.find({ where: { teamId: event.season.teamId } });
      playerIds = players.map(p => p.id);
    }

    for (const playerId of playerIds) {
      await this.update(eventId, { playerId, status: dto.status });
    }
  }

  async syncFromLineup(eventId: string): Promise<void> {
    const lineup = await this.lineupRepo.find({ where: { eventId } });
    // Players in lineup (starting or bench) are considered 'present'
    const presentIds = lineup.map(l => l.playerId);

    for (const pid of presentIds) {
      await this.update(eventId, { playerId: pid, status: 'present' });
    }
  }

  async getParticipationStats(teamId: string, seasonId?: string, leagueId?: string): Promise<any> {
    const players = await this.playerRepo.find({ where: { teamId } });
    if (players.length === 0) {
      return [];
    }

    const playerIds = players.map(p => p.id);
    const attendance = await this.attendanceRepo.find({
      where: { playerId: In(playerIds) },
      relations: ['event'],
    });

    // Filter by completed games and past practices/tryouts, as well as season/league
    const now = new Date();
    const filtered = attendance.filter(a => {
      if (!a.event) return false;
      
      // Future/unplayed events filter
      if (a.event.type === 'game') {
        if (a.event.status !== 'completed') return false;
      } else {
        // practices/tryouts must be in the past
        if (new Date(a.event.scheduledAt) > now) return false;
      }

      if (leagueId && a.event.leagueId !== leagueId) return false;
      if (seasonId && a.event.seasonId !== seasonId) return false;
      
      return true;
    });

    // Determine the unique set of tracked event IDs (those that have at least one attendance record)
    const trackedEventIds = new Set(filtered.map(a => a.eventId));

    const stats = [];
    for (const player of players) {
      const playerAttendance = filtered.filter(a => a.playerId === player.id);
      let totalEvents = 0;
      let present = 0;

      for (const eventId of trackedEventIds) {
        const record = playerAttendance.find(a => a.eventId === eventId);
        if (record) {
          const status = record.status;
          if (status !== 'injured') {
            totalEvents++;
            if (status === 'present' || status === 'tardy') {
              present++;
            }
          }
        }
      }

      stats.push({
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        totalEvents,
        present,
        percentage: totalEvents > 0 ? Math.round((present / totalEvents) * 100) : 0,
      });
    }

    return stats;
  }
}
