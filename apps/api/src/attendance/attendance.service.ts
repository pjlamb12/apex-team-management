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
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
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
    const stats = [];

    for (const player of players) {
      const attendance = await this.attendanceRepo.find({
        where: { playerId: player.id },
        relations: ['event'],
      });

      // Filter by season/league if provided
      let filtered = attendance;
      if (leagueId) {
        filtered = attendance.filter(a => a.event.leagueId === leagueId);
      } else if (seasonId) {
        filtered = attendance.filter(a => a.event.seasonId === seasonId);
      }

      // Injuries shouldn't count for or against players, exclude them from calculations
      const nonInjured = filtered.filter(a => a.status !== 'injured');
      const totalEvents = nonInjured.length;
      const present = nonInjured.filter(a => a.status === 'present' || a.status === 'tardy').length;
      
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
