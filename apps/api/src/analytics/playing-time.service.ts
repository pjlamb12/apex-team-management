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
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const lineup = await this.lineupRepo.find({ where: { eventId } });
    const gameEvents = await this.gameEventRepo.find({
      where: { eventId },
      order: { minuteOccurred: 'ASC', createdAt: 'ASC' },
    });

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

    // Initialize totals for everyone in the lineup
    lineup.forEach((entry) => {
      totalsMs[entry.playerId] = 0;
      positionTotalsMs[entry.playerId] = {};
      if (entry.status === 'starting') {
        onField.add(entry.playerId);
        stintStartMs[entry.playerId] = 0;
        stintPosition[entry.playerId] = entry.positionName || 'Unknown';
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
        const posName = payload.positionName || payload.position || 'Unknown';

        if (outId && onField.has(outId)) {
          closeStint(outId, eventTimeMs);
          delete stintStartMs[outId];
          delete stintPosition[outId];
          onField.delete(outId);
        }

        if (inId) {
          stintStartMs[inId] = eventTimeMs;
          stintPosition[inId] = posName;
          onField.add(inId);
          if (totalsMs[inId] === undefined) {
            totalsMs[inId] = 0;
            positionTotalsMs[inId] = {};
          }
        }
      } else if (ge.eventType === 'POSITION_SWAP') {
        const pA = payload.playerIdA;
        const pB = payload.playerIdB;
        
        if (pA && onField.has(pA)) closeStint(pA, eventTimeMs);
        if (pB && onField.has(pB)) closeStint(pB, eventTimeMs);

        if (pA && pB && onField.has(pA) && onField.has(pB)) {
          const posA = stintPosition[pA];
          const posB = stintPosition[pB];
          stintPosition[pA] = posB;
          stintPosition[pB] = posA;
          stintStartMs[pA] = eventTimeMs;
          stintStartMs[pB] = eventTimeMs;
        }
      }
    });

    if (event.status === 'completed') {
      // Calculate how much time is left in the final period
      const completedPeriods = currentPeriod - 1;
      const totalCompletedMinutes = completedPeriods * (event.periodLengthMinutes || 0);
      const remainingMinutes = Math.max(0, (event.durationMinutes || 0) - totalCompletedMinutes);
      const remainingMs = remainingMinutes * 60000;

      onField.forEach((pid) => {
        closeStint(pid, remainingMs);
      });
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

  async calculateForTeam(teamId: string, seasonId?: string): Promise<Record<string, PlayerPlaytime>> {
    const events = await this.eventRepo.find({
      where: seasonId ? { seasonId, type: 'game' } : { season: { teamId }, type: 'game' },
      relations: ['season', 'season.team'],
    });

    const teamResult: Record<string, PlayerPlaytime> = {};

    for (const event of events) {
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
