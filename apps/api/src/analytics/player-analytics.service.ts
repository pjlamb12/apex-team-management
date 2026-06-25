import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { PlayingTimeService } from './playing-time.service';

export interface PlayerHistoryEntry {
  eventId: string;
  eventName: string;
  eventType: 'game' | 'practice' | 'tryout';
  scheduledAt: Date;
  status: 'present' | 'absent' | 'tardy' | 'injured' | 'unknown';
  goals: number;
  assists: number;
  blockedShots: number;
  blockedPenaltyKicks: number;
  playingTimeSeconds: number;
}

export interface PlayerProfileAnalytics {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
    preferredPosition: string | null;
  };
  totalGamesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalBlockedShots: number;
  totalBlockedPenaltyKicks: number;
  totalMinutes: number;
  positionDistribution: Record<string, number>;
  history: PlayerHistoryEntry[];
}

@Injectable()
export class PlayerAnalyticsService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    private readonly playingTimeService: PlayingTimeService,
  ) {}

  async getPlayerProfile(playerId: string, teamId: string, seasonId?: string, leagueId?: string): Promise<PlayerProfileAnalytics> {
    const player = await this.playerRepo.findOne({ where: { id: playerId, teamId } });
    if (!player) throw new NotFoundException(`Player ${playerId} not found in team ${teamId}`);

    // Get all events for the team/season/league
    const where: any = {};
    if (leagueId) {
      where.leagueId = leagueId;
    } else if (seasonId) {
      where.seasonId = seasonId;
    } else {
      where.season = { teamId };
    }

    const events = await this.eventRepo.find({
      where,
      relations: ['season', 'season.team'],
      order: { scheduledAt: 'DESC' }
    });

    const eventIds = events.map(e => e.id);
    if (eventIds.length === 0) {
      return {
        player: {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          jerseyNumber: player.jerseyNumber,
          preferredPosition: player.preferredPosition
        },
        totalGamesPlayed: 0,
        totalGoals: 0,
        totalAssists: 0,
        totalBlockedShots: 0,
        totalBlockedPenaltyKicks: 0,
        totalMinutes: 0,
        positionDistribution: {},
        history: []
      };
    }

    const attendance = await this.attendanceRepo.find({
      where: { playerId, eventId: In(eventIds) }
    });

    const gameEvents = await this.gameEventRepo.find({
      where: { eventId: In(eventIds) }
    });

    const history: PlayerHistoryEntry[] = [];
    let totalGoals = 0;
    let totalAssists = 0;
    let totalBlockedShots = 0;
    let totalBlockedPenaltyKicks = 0;
    let totalSeconds = 0;
    let gamesPlayed = 0;
    const positionDistribution: Record<string, number> = {};

    for (const event of events) {
      const attRecord = attendance.find(a => a.eventId === event.id);
      const isPresent = attRecord?.status === 'present' || attRecord?.status === 'tardy';
      
      let eventGoals = 0;
      let eventAssists = 0;
      let eventBlockedShots = 0;
      let eventBlockedPenaltyKicks = 0;
      let playingTime = 0;

      if (event.type === 'game') {
        // Calculate goals/assists for this specific game
        const matchEvents = gameEvents.filter(ge => ge.eventId === event.id);
        matchEvents.forEach(ge => {
          const payload = ge.payload as any;
          if (ge.eventType === 'GOAL') {
             if (payload.scorerId === playerId || payload.playerId === playerId) eventGoals++;
             if (payload.assistorId === playerId) eventAssists++;
          } else if (ge.eventType === 'ASSIST') {
             if (payload.assistorId === playerId || payload.playerId === playerId) eventAssists++;
          } else if (ge.eventType === 'BLOCKED_SHOT') {
             if (payload.playerId === playerId) eventBlockedShots++;
          } else if (ge.eventType === 'BLOCKED_PENALTY') {
             if (payload.playerId === playerId) eventBlockedPenaltyKicks++;
          } else if (ge.eventType === 'SHOOTOUT_KICK') {
             if (payload.team === 'opponent' && payload.outcome === 'save' && payload.goalkeeperId === playerId) {
               eventBlockedPenaltyKicks++;
             }
          }
        });

        // Calculate playing time for this specific game
        try {
          const ptResult = await this.playingTimeService.calculateForEvent(event.id);
          const stats = ptResult[playerId];
          if (stats) {
            playingTime = stats.totalSeconds;
            Object.keys(stats.positionSeconds).forEach(pos => {
              positionDistribution[pos] = (positionDistribution[pos] || 0) + stats.positionSeconds[pos];
            });
          }
        } catch (e) {
          // Playtime engine might fail if game is misconfigured, skip silently
        }

        if (isPresent && event.status === 'completed') gamesPlayed++;
      }

      totalGoals += eventGoals;
      totalAssists += eventAssists;
      totalBlockedShots += eventBlockedShots;
      totalBlockedPenaltyKicks += eventBlockedPenaltyKicks;
      totalSeconds += playingTime;

      history.push({
        eventId: event.id,
        eventName: event.type === 'game' ? `vs ${event.opponent}` : (event.type === 'tryout' ? 'Tryout Session' : 'Practice'),
        eventType: event.type,
        scheduledAt: event.scheduledAt!,
        status: attRecord?.status || 'unknown',
        goals: eventGoals,
        assists: eventAssists,
        blockedShots: eventBlockedShots,
        blockedPenaltyKicks: eventBlockedPenaltyKicks,
        playingTimeSeconds: playingTime
      });
    }

    return {
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        preferredPosition: player.preferredPosition
      },
      totalGamesPlayed: gamesPlayed,
      totalGoals,
      totalAssists,
      totalBlockedShots,
      totalBlockedPenaltyKicks,
      totalMinutes: Math.floor(totalSeconds / 60),
      positionDistribution,
      history
    };
  }
}
