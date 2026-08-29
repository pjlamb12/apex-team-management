import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { TeamEntity } from '../entities/team.entity';
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
  kills?: number;
  aces?: number;
  blocks?: number;
  digs?: number;
  serviceErrors?: number;
  hittingErrors?: number;
}

export interface PlayerProfileAnalytics {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
    preferredPosition: string | null;
    isActive?: boolean;
  };
  totalGamesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalBlockedShots: number;
  totalBlockedPenaltyKicks: number;
  totalMinutes: number;
  positionDistribution: Record<string, number>;
  history: PlayerHistoryEntry[];
  totalKills?: number;
  totalAces?: number;
  totalBlocks?: number;
  totalDigs?: number;
  totalServiceErrors?: number;
  totalHittingErrors?: number;
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

    let isVolleyball = false;
    if (this.playerRepo.manager) {
      const team = await this.playerRepo.manager.findOne(TeamEntity, {
        where: { id: teamId },
        relations: ['sport'],
      });
      isVolleyball = team?.sport?.name === 'Volleyball';
    }

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
        history: [],
        totalKills: 0,
        totalAces: 0,
        totalBlocks: 0,
        totalDigs: 0,
        totalServiceErrors: 0,
        totalHittingErrors: 0
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
    let totalKills = 0;
    let totalAces = 0;
    let totalBlocks = 0;
    let totalDigs = 0;
    let totalServiceErrors = 0;
    let totalHittingErrors = 0;
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
      let eventKills = 0;
      let eventAces = 0;
      let eventBlocks = 0;
      let eventDigs = 0;
      let eventServiceErrors = 0;
      let eventHittingErrors = 0;
      let playingTime = 0;

      if (event.type === 'game') {
        // Calculate goals/assists/volleyball metrics for this specific game
        const matchEvents = gameEvents.filter(ge => ge.eventId === event.id);
        matchEvents.forEach(ge => {
          const payload = ge.payload as any;
          if (ge.eventType === 'GOAL') {
             if (payload.scorerId === playerId || payload.playerId === playerId) eventGoals++;
             if (payload.assistorId === playerId) eventAssists++;
          } else if (ge.eventType === 'ASSIST' || ge.eventType === 'SET_ASSIST') {
             if (payload.assistorId === playerId || payload.playerId === playerId) eventAssists++;
          } else if (ge.eventType === 'BLOCKED_SHOT') {
             if (payload.playerId === playerId) eventBlockedShots++;
          } else if (ge.eventType === 'BLOCKED_PENALTY') {
             if (payload.playerId === playerId) eventBlockedPenaltyKicks++;
          } else if (ge.eventType === 'SHOOTOUT_KICK') {
             if (payload.team === 'opponent' && payload.outcome === 'save' && payload.goalkeeperId === playerId) {
                eventBlockedPenaltyKicks++;
             }
          } else if (ge.eventType === 'KILL') {
             if (payload.scorerId === playerId || payload.playerId === playerId) eventKills++;
          } else if (ge.eventType === 'ACE') {
             if (payload.scorerId === playerId || payload.playerId === playerId) eventAces++;
          } else if (ge.eventType === 'BLOCK') {
             if (payload.playerId === playerId) eventBlocks++;
          } else if (ge.eventType === 'DIG') {
             if (payload.playerId === playerId) eventDigs++;
          } else if (ge.eventType === 'SERVICE_ERROR') {
             if (payload.playerId === playerId) eventServiceErrors++;
          } else if (ge.eventType === 'HITTING_ERROR') {
             if (payload.playerId === playerId) eventHittingErrors++;
          }
        });

        // Calculate playing time for this specific game
        try {
          if (!event.ignorePlayingTime) {
            const ptResult = await this.playingTimeService.calculateForEvent(event.id);
            const stats = ptResult[playerId];
            if (stats) {
              playingTime = stats.totalSeconds;
              Object.keys(stats.positionSeconds).forEach(pos => {
                positionDistribution[pos] = (positionDistribution[pos] || 0) + stats.positionSeconds[pos];
              });
            }
          }
        } catch (e) {
          // Playtime engine might fail if game is misconfigured, skip silently
        }

        if (isPresent && event.status === 'completed') gamesPlayed++;
      }

      if (event.type === 'game' && event.status === 'completed') {
        totalGoals += eventGoals;
        totalAssists += eventAssists;
        totalBlockedShots += eventBlockedShots;
        totalBlockedPenaltyKicks += eventBlockedPenaltyKicks;
        totalKills += eventKills;
        totalAces += eventAces;
        totalBlocks += eventBlocks;
        totalDigs += eventDigs;
        totalServiceErrors += eventServiceErrors;
        totalHittingErrors += eventHittingErrors;
        totalSeconds += playingTime;
      }

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
        playingTimeSeconds: playingTime,
        kills: eventKills,
        aces: eventAces,
        blocks: eventBlocks,
        digs: eventDigs,
        serviceErrors: eventServiceErrors,
        hittingErrors: eventHittingErrors
      });
    }

    return {
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        preferredPosition: player.preferredPosition,
        isActive: player.isActive,
      },
      totalGamesPlayed: gamesPlayed,
      totalGoals,
      totalAssists,
      totalBlockedShots,
      totalBlockedPenaltyKicks,
      totalKills,
      totalAces,
      totalBlocks,
      totalDigs,
      totalServiceErrors,
      totalHittingErrors,
      totalMinutes: isVolleyball ? totalSeconds : Math.floor(totalSeconds / 60),
      positionDistribution,
      history
    };
  }
}
