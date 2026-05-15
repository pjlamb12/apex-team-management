import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GameEventEntity } from '../entities/game-event.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';

export interface PlayerPerformanceMetrics {
  playerId: string;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
}

@Injectable()
export class PerformanceMetricsService {
  constructor(
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
  ) {}

  async getTeamMetrics(teamId: string, seasonId?: string): Promise<PlayerPerformanceMetrics[]> {
    // Find all games for the team/season
    const events = await this.eventRepo.find({ 
      where: seasonId ? { seasonId, type: 'game' } : { season: { teamId }, type: 'game' },
      relations: ['season', 'season.team']
    });
    
    if (events.length === 0) {
      const players = await this.playerRepo.find({ where: { teamId } });
      return players.map(p => this.initializeMetrics(p));
    }

    return this.getMetricsForEvents(teamId, events.map(e => e.id));
  }

  async getEventMetrics(teamId: string, eventId: string): Promise<PlayerPerformanceMetrics[]> {
    return this.getMetricsForEvents(teamId, [eventId]);
  }

  private async getMetricsForEvents(teamId: string, eventIds: string[]): Promise<PlayerPerformanceMetrics[]> {
    const players = await this.playerRepo.find({ where: { teamId } });
    
    // Get all game events for these games
    const gameEvents = await this.gameEventRepo.find({
      where: { eventId: In(eventIds) }
    });

    // Get attendance for these games
    const attendance = await this.attendanceRepo.find({
      where: { eventId: In(eventIds) }
    });

    const metricsMap: Record<string, PlayerPerformanceMetrics> = {};
    players.forEach(p => {
      metricsMap[p.id] = this.initializeMetrics(p);
    });

    // Aggregate attendance (games played)
    attendance.forEach(a => {
      if (metricsMap[a.playerId] && (a.status === 'present' || a.status === 'tardy')) {
        metricsMap[a.playerId].gamesPlayed++;
      }
    });

    // Aggregate game events
    gameEvents.forEach(ge => {
      const payload = ge.payload as any;
      
      if (ge.eventType === 'GOAL') {
        const scorerId = payload.scorerId || payload.playerId;
        if (scorerId && metricsMap[scorerId]) {
          metricsMap[scorerId].goals++;
        }
        const assistorId = payload.assistorId;
        if (assistorId && metricsMap[assistorId]) {
          metricsMap[assistorId].assists++;
        }
      } else if (ge.eventType === 'ASSIST') {
        const assistorId = payload.assistorId || payload.playerId;
        if (assistorId && metricsMap[assistorId]) {
          metricsMap[assistorId].assists++;
        }
      } else if (ge.eventType === 'YELLOW_CARD') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].yellowCards++;
        }
      } else if (ge.eventType === 'RED_CARD') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].redCards++;
        }
      } else if (ge.eventType === 'CARD') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          if (payload.color === 'yellow') metricsMap[playerId].yellowCards++;
          else if (payload.color === 'red') metricsMap[playerId].redCards++;
        }
      }
    });

    return Object.values(metricsMap);
  }

  private initializeMetrics(player: PlayerEntity): PlayerPerformanceMetrics {
    return {
      playerId: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      gamesPlayed: 0
    };
  }
}
