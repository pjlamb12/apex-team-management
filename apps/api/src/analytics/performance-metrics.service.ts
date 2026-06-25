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
  preferredPosition: string | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
  blockedShots: number;
  blockedPenaltyKicks: number;
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

  async getTeamMetrics(teamId: string, seasonId?: string, leagueId?: string): Promise<PlayerPerformanceMetrics[]> {
    // Find all games for the team/season/league
    const where: any = { type: 'game', status: 'completed' };
    if (leagueId) {
      where.leagueId = leagueId;
    } else if (seasonId) {
      where.seasonId = seasonId;
    } else {
      where.season = { teamId };
    }

    const events = await this.eventRepo.find({ 
      where,
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
      } else if (ge.eventType === 'BLOCKED_SHOT') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].blockedShots++;
        }
      } else if (ge.eventType === 'BLOCKED_PENALTY') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].blockedPenaltyKicks++;
        }
      } else if (ge.eventType === 'SHOOTOUT_KICK') {
        if (payload.team === 'opponent' && payload.outcome === 'save') {
          const goalkeeperId = payload.goalkeeperId;
          if (goalkeeperId && metricsMap[goalkeeperId]) {
            metricsMap[goalkeeperId].blockedPenaltyKicks++;
          }
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
      preferredPosition: player.preferredPosition,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      gamesPlayed: 0,
      blockedShots: 0,
      blockedPenaltyKicks: 0
    };
  }
}
