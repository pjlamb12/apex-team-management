import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';

export type SubField = 'inPlayerId' | 'outPlayerId';
export type EntryType = 'IN' | 'OUT';

export interface TimelineEntry {
  type: EntryType;
  gameEventId: string;
  field: SubField;
  period: number;
  gameTimeMs: number;
}

export interface PlayingTimeViolation {
  playerId: string;
  violationType: 'DOUBLE_OUT' | 'DOUBLE_IN';
  earlierEntry: TimelineEntry | null;
  laterEntry: TimelineEntry;
}

export interface SuggestedCorrection {
  gameEventId: string;
  field: 'outPlayerId';
  currentPlayerId: string;
  correctedPlayerId: string;
  reason: string;
}

export interface PlayingTimeValidationReport {
  eventId: string;
  isValid: boolean;
  violations: PlayingTimeViolation[];
  suggestedCorrections: SuggestedCorrection[];
}

interface PendingCorrection {
  gameEventId: string;
  field: 'outPlayerId';
  currentPlayerId: string;
  correctedPlayerId: string;
}

function eventPeriod(ge: GameEventEntity): number {
  return (ge.payload as any)?.period ?? 1;
}

function eventTimeMs(ge: GameEventEntity): number {
  const payload = ge.payload as any;
  return payload?.gameTimeMs ?? ((ge.minuteOccurred ?? 1) - 1) * 60000;
}

function sortSubEvents(events: GameEventEntity[]): GameEventEntity[] {
  return [...events].sort((a, b) => {
    const periodDiff = eventPeriod(a) - eventPeriod(b);
    if (periodDiff !== 0) return periodDiff;
    return eventTimeMs(a) - eventTimeMs(b);
  });
}

function buildTimelines(sortedSubEvents: GameEventEntity[]): Map<string, TimelineEntry[]> {
  const timelines = new Map<string, TimelineEntry[]>();
  const push = (playerId: string, entry: TimelineEntry) => {
    if (!timelines.has(playerId)) timelines.set(playerId, []);
    timelines.get(playerId)!.push(entry);
  };

  sortedSubEvents.forEach((ge) => {
    const payload = (ge.payload ?? {}) as any;
    const period = eventPeriod(ge);
    const gameTimeMs = eventTimeMs(ge);
    const outId = payload.outPlayerId || payload.playerIdOut;
    const inId = payload.inPlayerId || payload.playerIdIn;

    if (outId) {
      push(outId, { type: 'OUT', gameEventId: ge.id, field: 'outPlayerId', period, gameTimeMs });
    }
    if (inId) {
      push(inId, { type: 'IN', gameEventId: ge.id, field: 'inPlayerId', period, gameTimeMs });
    }
  });

  return timelines;
}

function detectViolationsForPlayer(
  playerId: string,
  timeline: TimelineEntry[],
  isStarter: boolean,
): PlayingTimeViolation[] {
  const violations: PlayingTimeViolation[] = [];
  let prevType: EntryType | null = null;
  let prevEntry: TimelineEntry | null = null;

  timeline.forEach((entry, i) => {
    const expected: EntryType = i === 0 ? (isStarter ? 'OUT' : 'IN') : prevType === 'IN' ? 'OUT' : 'IN';
    if (entry.type !== expected) {
      violations.push({
        playerId,
        violationType: entry.type === 'IN' ? 'DOUBLE_IN' : 'DOUBLE_OUT',
        earlierEntry: prevEntry,
        laterEntry: entry,
      });
    }
    prevType = entry.type;
    prevEntry = entry;
  });

  return violations;
}

function detectAllViolations(
  sortedSubEvents: GameEventEntity[],
  startingPlayerIds: Set<string>,
): PlayingTimeViolation[] {
  const timelines = buildTimelines(sortedSubEvents);
  const violations: PlayingTimeViolation[] = [];
  timelines.forEach((timeline, playerId) => {
    violations.push(...detectViolationsForPlayer(playerId, timeline, startingPlayerIds.has(playerId)));
  });
  return violations;
}

function isChronologicallyAfter(entry: TimelineEntry, candidate: TimelineEntry): boolean {
  return entry.period !== candidate.period ? entry.period > candidate.period : entry.gameTimeMs > candidate.gameTimeMs;
}

function resolveCorrections(
  violations: PlayingTimeViolation[],
  sortedSubEvents: GameEventEntity[],
  startingPlayerIds: Set<string>,
): PendingCorrection[] {
  const doubleOuts = violations.filter((v) => v.violationType === 'DOUBLE_OUT');
  const doubleIns = violations.filter((v) => v.violationType === 'DOUBLE_IN');
  const resolved = new Set<PlayingTimeViolation>();
  const usedGameEventIds = new Set<string>();
  const corrections: PendingCorrection[] = [];

  for (const v of doubleOuts) {
    if (resolved.has(v)) continue;

    const candidates = [v.earlierEntry, v.laterEntry].filter(
      (e): e is TimelineEntry => e !== null && e.field === 'outPlayerId' && !usedGameEventIds.has(e.gameEventId),
    );

    let matched = false;
    for (const candidate of candidates) {
      if (matched) break;
      for (const w of doubleIns) {
        if (matched) break;
        if (resolved.has(w) || w.playerId === v.playerId) continue;
        if (!isChronologicallyAfter(w.laterEntry, candidate)) continue;

        const trialEvents = sortedSubEvents.map((ge) =>
          ge.id === candidate.gameEventId
            ? ({ ...ge, payload: { ...(ge.payload as any), outPlayerId: w.playerId } } as GameEventEntity)
            : ge,
        );
        const trialViolations = detectAllViolations(trialEvents, startingPlayerIds);

        if (trialViolations.length === 0) {
          corrections.push({
            gameEventId: candidate.gameEventId,
            field: 'outPlayerId',
            currentPlayerId: v.playerId,
            correctedPlayerId: w.playerId,
          });
          resolved.add(v);
          resolved.add(w);
          usedGameEventIds.add(candidate.gameEventId);
          matched = true;
        }
      }
    }
  }

  return corrections;
}

@Injectable()
export class PlayingTimeValidationService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
  ) {}

  async validateForEvent(eventId: string): Promise<PlayingTimeValidationReport> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const lineup = await this.lineupRepo.find({ where: { eventId } });
    const startingPlayerIds = new Set(lineup.filter((l) => l.status === 'starting').map((l) => l.playerId));

    const subEvents = await this.gameEventRepo.find({ where: { eventId, eventType: 'SUB' } });
    const sortedSubEvents = sortSubEvents(subEvents);

    const violations = detectAllViolations(sortedSubEvents, startingPlayerIds);
    const pendingCorrections = resolveCorrections(violations, sortedSubEvents, startingPlayerIds);

    const playerIds = Array.from(
      new Set(pendingCorrections.flatMap((c) => [c.currentPlayerId, c.correctedPlayerId])),
    );
    const players = playerIds.length ? await this.playerRepo.find({ where: { id: In(playerIds) } }) : [];
    const nameById = new Map(players.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
    const displayName = (id: string) => nameById.get(id) ?? id;

    const suggestedCorrections: SuggestedCorrection[] = pendingCorrections.map((c) => ({
      ...c,
      reason:
        `${displayName(c.currentPlayerId)} appears to check out of the game twice in a row with no time back ` +
        `on the field in between, while ${displayName(c.correctedPlayerId)} appears to re-enter the game twice ` +
        `without ever being recorded as leaving. Changing this substitution's outgoing player from ` +
        `${displayName(c.currentPlayerId)} to ${displayName(c.correctedPlayerId)} resolves both.`,
    }));

    return {
      eventId,
      isValid: violations.length === 0,
      violations,
      suggestedCorrections,
    };
  }
}
