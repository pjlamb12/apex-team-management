import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';

export interface PlayerPlaytime {
  playerId: string;
  totalSeconds: number;
  positionSeconds: Record<string, number>;
}

function getPositionFromSlot(slot: number, isVolleyball?: boolean): string {
  if (isVolleyball) {
    if (slot === 99) return 'Libero';
    const defaults = [
      'Opposite Hitter',
      'Outside Hitter',
      'Middle Blocker',
      'Opposite Hitter',
      'Outside Hitter',
      'Middle Blocker',
    ];
    return defaults[slot] || 'Outside Hitter';
  }
  if (slot === 0) return 'GK';
  if (slot >= 1 && slot <= 5) return 'DEF';
  if (slot >= 6 && slot <= 10) return 'MID';
  if (slot >= 11 && slot <= 15) return 'FWD';
  return 'UNKNOWN';
}

@Injectable()
export class PlayingTimeService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
  ) {}

  async calculateForEvent(eventId: string): Promise<Record<string, PlayerPlaytime>> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['season', 'season.team', 'season.team.sport'],
    });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const lineup = await this.lineupRepo.find({ where: { eventId } });
    const gameEvents = await this.gameEventRepo.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });

    const isVolleyball = event?.season?.team?.sport?.name === 'Volleyball';

    if (gameEvents.length === 0) {
      const result: Record<string, PlayerPlaytime> = {};
      lineup.forEach((entry) => {
        result[entry.playerId] = {
          playerId: entry.playerId,
          totalSeconds: 0,
          positionSeconds: {},
        };
      });
      return result;
    }

    if (isVolleyball) {
      const totalsPoints: Record<string, number> = {};
      const positionTotalsPoints: Record<string, Record<string, number>> = {};
      
      const onField = new Set<string>();
      const stintPosition: Record<string, string> = {};

      // Initialize totals for everyone in the lineup
      lineup.forEach((entry) => {
        totalsPoints[entry.playerId] = 0;
        positionTotalsPoints[entry.playerId] = {};
        if (entry.status === 'starting') {
          onField.add(entry.playerId);
          stintPosition[entry.playerId] = entry.positionName || 'Unknown';
        }
      });

      // Point scoring events
      const pointEventTypes = new Set([
        'KILL', 'ACE', 'BLOCK', 'POINT_WON',
        'SERVICE_ERROR', 'HITTING_ERROR', 'POINT_LOST', 'OPPONENT_GOAL'
      ]);

      gameEvents.forEach((ge) => {
        const payload = ge.payload as any;

        if (ge.eventType === 'SUB') {
          const outId = payload.outPlayerId || payload.playerIdOut;
          const inId = payload.inPlayerId || payload.playerIdIn;
          const posName = payload.positionName || payload.position || 'Unknown';

          if (outId && onField.has(outId)) {
            delete stintPosition[outId];
            onField.delete(outId);
          }

          if (inId) {
            stintPosition[inId] = posName;
            onField.add(inId);
            if (totalsPoints[inId] === undefined) {
              totalsPoints[inId] = 0;
              positionTotalsPoints[inId] = {};
            }
          }
        } else if (ge.eventType === 'POSITION_SWAP') {
          const pA = payload.playerIdA;
          const pB = payload.playerIdB;
          
          if (pA && pB && onField.has(pA) && onField.has(pB)) {
            const posA = stintPosition[pA];
            const posB = stintPosition[pB];
            stintPosition[pA] = posB;
            stintPosition[pB] = posA;
          }
        } else if (pointEventTypes.has(ge.eventType)) {
          // A point occurred! Everyone currently on field gets 1 point
          onField.forEach((pid) => {
            const pos = stintPosition[pid] || 'Unknown';
            totalsPoints[pid] = (totalsPoints[pid] || 0) + 1;
            if (!positionTotalsPoints[pid]) positionTotalsPoints[pid] = {};
            positionTotalsPoints[pid][pos] = (positionTotalsPoints[pid][pos] || 0) + 1;
          });
        }
      });

      const result: Record<string, PlayerPlaytime> = {};
      Object.keys(totalsPoints).forEach((pid) => {
        result[pid] = {
          playerId: pid,
          totalSeconds: totalsPoints[pid],
          positionSeconds: positionTotalsPoints[pid] || {},
        };
      });
      return result;
    }

    const totalsMs: Record<string, number> = {};
    const positionTotalsMs: Record<string, Record<string, number>> = {};
    const stintStartMs: Record<string, number> = {};
    const stintPosition: Record<string, string> = {};
    const onField = new Set<string>();

    const closeStint = (pid: string, endTimeMs: number) => {
      const start = stintStartMs[pid] ?? 0;
      const duration = Math.max(0, endTimeMs - start);
      totalsMs[pid] = (totalsMs[pid] || 0) + duration;
      
      const pos = stintPosition[pid] || 'Unknown';
      if (!positionTotalsMs[pid]) positionTotalsMs[pid] = {};
      positionTotalsMs[pid][pos] = (positionTotalsMs[pid][pos] || 0) + duration;
    };

    const slotToPlayerId: Record<number, string> = {};

    // Initialize totals for everyone in the lineup
    lineup.forEach((entry) => {
      totalsMs[entry.playerId] = 0;
      positionTotalsMs[entry.playerId] = {};
      if (entry.status === 'starting') {
        onField.add(entry.playerId);
        stintStartMs[entry.playerId] = 0;
        const pos = entry.positionName || (entry.slotIndex !== null && entry.slotIndex !== undefined ? getPositionFromSlot(entry.slotIndex, isVolleyball) : 'Unknown');
        stintPosition[entry.playerId] = pos;
        if (entry.slotIndex !== null && entry.slotIndex !== undefined) {
          slotToPlayerId[entry.slotIndex] = entry.playerId;
        }
      }
    });

    let currentPeriod = 1;

    gameEvents.forEach((ge) => {
      const payload = ge.payload as any;
      const eventTimeMs = payload.gameTimeMs ?? (ge.minuteOccurred - 1) * 60000;

      if (ge.eventType === 'PERIOD_END') {
        onField.forEach((pid) => {
          closeStint(pid, eventTimeMs);
          stintStartMs[pid] = 0; // Stints reset at period start
        });
        currentPeriod++;
      } else if (ge.eventType === 'SUB') {
        const outId = payload.outPlayerId || payload.playerIdOut;
        const inId = payload.inPlayerId || payload.playerIdIn;
        const slot = payload.slotIndex ?? payload.slotIndexA;
        const posName = payload.positionName || payload.position || (slot !== undefined ? getPositionFromSlot(slot, isVolleyball) : 'Unknown');

        if (outId && onField.has(outId)) {
          closeStint(outId, eventTimeMs);
          delete stintStartMs[outId];
          delete stintPosition[outId];
          onField.delete(outId);
        }

        if (inId) {
          if (onField.has(inId)) {
            closeStint(inId, eventTimeMs);
          }
          stintStartMs[inId] = eventTimeMs;
          stintPosition[inId] = posName;
          onField.add(inId);
          if (totalsMs[inId] === undefined) {
            totalsMs[inId] = 0;
            positionTotalsMs[inId] = {};
          }
          if (slot !== undefined && slot !== null) {
            slotToPlayerId[slot] = inId;
          }
        }
      } else if (ge.eventType === 'POSITION_SWAP') {
        const slotA = payload.slotIndexA;
        const slotB = payload.slotIndexB;

        let pA = payload.playerIdA;
        let pB = payload.playerIdB;

        if (!pA && slotA !== undefined) pA = slotToPlayerId[slotA];
        if (!pB && slotB !== undefined) pB = slotToPlayerId[slotB];

        const posNameA = payload.positionNameA || (slotB !== undefined ? getPositionFromSlot(slotB, isVolleyball) : undefined);
        const posNameB = payload.positionNameB || (slotA !== undefined ? getPositionFromSlot(slotA, isVolleyball) : undefined);

        if (pA && onField.has(pA)) closeStint(pA, eventTimeMs);
        if (pB && onField.has(pB)) closeStint(pB, eventTimeMs);

        if (pA && pB && onField.has(pA) && onField.has(pB)) {
          const oldPosA = stintPosition[pA];
          const oldPosB = stintPosition[pB];

          stintPosition[pA] = posNameA || oldPosB || 'Unknown';
          stintPosition[pB] = posNameB || oldPosA || 'Unknown';
          stintStartMs[pA] = eventTimeMs;
          stintStartMs[pB] = eventTimeMs;

          if (slotA !== undefined && slotB !== undefined) {
            slotToPlayerId[slotA] = pB;
            slotToPlayerId[slotB] = pA;
          }
        } else if (pA && onField.has(pA)) {
          const oldPosA = stintPosition[pA];
          stintPosition[pA] = posNameA || (slotB !== undefined ? getPositionFromSlot(slotB, isVolleyball) : oldPosA || 'Unknown');
          stintStartMs[pA] = eventTimeMs;

          if (slotA !== undefined && slotB !== undefined) {
            delete slotToPlayerId[slotA];
            slotToPlayerId[slotB] = pA;
          }
        } else if (pB && onField.has(pB)) {
          const oldPosB = stintPosition[pB];
          stintPosition[pB] = posNameB || (slotA !== undefined ? getPositionFromSlot(slotA, isVolleyball) : oldPosB || 'Unknown');
          stintStartMs[pB] = eventTimeMs;

          if (slotA !== undefined && slotB !== undefined) {
            delete slotToPlayerId[slotB];
            slotToPlayerId[slotA] = pB;
          }
        }
      }
    });

    if (event.status === 'completed') {
      // Calculate how much time is left in the final period if period end wasn't logged
      const completedPeriods = currentPeriod - 1;
      const totalCompletedMinutes = completedPeriods * (event.periodLengthMinutes || 0);
      const remainingMinutes = Math.max(0, (event.durationMinutes || 0) - totalCompletedMinutes);
      if (remainingMinutes > 0) {
        const remainingMs = remainingMinutes * 60000;
        onField.forEach((pid) => {
          closeStint(pid, remainingMs);
        });
      }
    }

    const result: Record<string, PlayerPlaytime> = {};
    Object.keys(totalsMs).forEach((pid) => {
      const posTotals: Record<string, number> = {};
      Object.keys(positionTotalsMs[pid] || {}).forEach(pos => {
        posTotals[pos] = Math.floor(positionTotalsMs[pid][pos] / 1000);
      });

      result[pid] = {
        playerId: pid,
        totalSeconds: Math.floor(totalsMs[pid] / 1000),
        positionSeconds: posTotals,
      };
    });

    return result;
  }

  async calculateForTeam(teamId: string, seasonId?: string, leagueId?: string): Promise<Record<string, PlayerPlaytime>> {
    const where: any = { type: 'game' };
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
    });

    const teamResult: Record<string, PlayerPlaytime> = {};

    for (const event of events) {
      if (event.ignorePlayingTime) {
        continue;
      }
      const eventResult = await this.calculateForEvent(event.id);
      
      Object.keys(eventResult).forEach(pid => {
        if (!teamResult[pid]) {
          teamResult[pid] = {
            playerId: pid,
            totalSeconds: 0,
            positionSeconds: {}
          };
        }
        
        teamResult[pid].totalSeconds += eventResult[pid].totalSeconds;
        
        Object.keys(eventResult[pid].positionSeconds).forEach(pos => {
          teamResult[pid].positionSeconds[pos] = (teamResult[pid].positionSeconds[pos] || 0) + eventResult[pid].positionSeconds[pos];
        });
      });
    }

    return teamResult;
  }
}
