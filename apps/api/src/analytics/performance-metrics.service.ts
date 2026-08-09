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
  jerseyNumber?: number | null;
  preferredPosition: string | null;
  isGuest?: boolean;
  isActive?: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
  blockedShots: number;
  blockedPenaltyKicks: number;
  kills?: number;
  aces?: number;
  blocks?: number;
  digs?: number;
  serviceErrors?: number;
  hittingErrors?: number;
  hits?: number;
  serveAttempts?: number;
  blockTouches?: number;
  setAttempts?: number;
  setAssists?: number;
  setErrors?: number;
  passCount?: number;
  passScoreSum?: number;
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

  async getTeamMetrics(
    teamId: string,
    seasonId?: string,
    leagueId?: string,
    eventType: 'game' | 'practice' | 'all' = 'game'
  ): Promise<PlayerPerformanceMetrics[]> {
    const baseWhere: any = {};
    if (leagueId) {
      baseWhere.leagueId = leagueId;
    } else if (seasonId) {
      baseWhere.seasonId = seasonId;
    } else {
      baseWhere.season = { teamId };
    }

    let events: EventEntity[] = [];
    if (eventType === 'game') {
      events = await this.eventRepo.find({
        where: { ...baseWhere, type: 'game', status: 'completed' },
        relations: ['season', 'season.team']
      });
    } else if (eventType === 'practice') {
      events = await this.eventRepo.find({
        where: { ...baseWhere, type: 'practice' },
        relations: ['season', 'season.team']
      });
    } else {
      const [games, practices] = await Promise.all([
        this.eventRepo.find({
          where: { ...baseWhere, type: 'game', status: 'completed' },
          relations: ['season', 'season.team']
        }),
        this.eventRepo.find({
          where: { ...baseWhere, type: 'practice' },
          relations: ['season', 'season.team']
        })
      ]);
      events = [...games, ...practices];
    }
    const isFiltered = !!(seasonId || leagueId);
    let result: PlayerPerformanceMetrics[] = [];
    if (events.length === 0) {
      const players = await this.playerRepo.find({ where: { teamId } });
      result = players.map(p => this.initializeMetrics(p));
    } else {
      result = await this.getMetricsForEvents(teamId, events.map(e => e.id));
    }

    if (isFiltered) {
      return result.filter(m => !m.isGuest || m.gamesPlayed > 0);
    }
    return result;
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
      } else if (ge.eventType === 'KILL') {
        const scorerId = payload.scorerId || payload.playerId;
        if (scorerId && metricsMap[scorerId]) {
          metricsMap[scorerId].kills = (metricsMap[scorerId].kills || 0) + 1;
        }
      } else if (ge.eventType === 'ACE') {
        const scorerId = payload.scorerId || payload.playerId;
        if (scorerId && metricsMap[scorerId]) {
          metricsMap[scorerId].aces = (metricsMap[scorerId].aces || 0) + 1;
        }
      } else if (ge.eventType === 'BLOCK') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].blocks = (metricsMap[playerId].blocks || 0) + 1;
        }
      } else if (ge.eventType === 'DIG') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].digs = (metricsMap[playerId].digs || 0) + 1;
        }
      } else if (ge.eventType === 'SERVICE_ERROR') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].serviceErrors = (metricsMap[playerId].serviceErrors || 0) + 1;
        }
      } else if (ge.eventType === 'HITTING_ERROR') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].hittingErrors = (metricsMap[playerId].hittingErrors || 0) + 1;
        }
      } else if (ge.eventType === 'HIT') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].hits = (metricsMap[playerId].hits || 0) + 1;
        }
      } else if (ge.eventType === 'SERVE_ATTEMPT') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].serveAttempts = (metricsMap[playerId].serveAttempts || 0) + 1;
        }
      } else if (ge.eventType === 'BLOCK_TOUCH') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].blockTouches = (metricsMap[playerId].blockTouches || 0) + 1;
        }
      } else if (ge.eventType === 'SET_ATTEMPT') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].setAttempts = (metricsMap[playerId].setAttempts || 0) + 1;
        }
      } else if (ge.eventType === 'SET_ASSIST') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].setAssists = (metricsMap[playerId].setAssists || 0) + 1;
          metricsMap[playerId].assists++;
        }
      } else if (ge.eventType === 'SET_ERROR') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].setErrors = (metricsMap[playerId].setErrors || 0) + 1;
        }
      } else if (ge.eventType === 'SERVE_RECEIVE') {
        const playerId = payload.playerId;
        if (playerId && metricsMap[playerId]) {
          metricsMap[playerId].passCount = (metricsMap[playerId].passCount || 0) + 1;
          const score = payload.score ?? ge.payload?.score ?? 0;
          metricsMap[playerId].passScoreSum = (metricsMap[playerId].passScoreSum || 0) + score;
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
      jerseyNumber: player.jerseyNumber,
      preferredPosition: player.preferredPosition,
      isGuest: player.isGuest,
      isActive: player.isActive,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      gamesPlayed: 0,
      blockedShots: 0,
      blockedPenaltyKicks: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      digs: 0,
      serviceErrors: 0,
      hittingErrors: 0,
      hits: 0,
      serveAttempts: 0,
      blockTouches: 0,
      setAttempts: 0,
      setAssists: 0,
      setErrors: 0,
      passCount: 0,
      passScoreSum: 0
    };
  }
}
