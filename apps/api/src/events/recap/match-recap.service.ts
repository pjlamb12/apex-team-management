import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../../entities/event.entity';
import { GameEventEntity } from '../../entities/game-event.entity';
import { EventNoteEntity } from '../../entities/event-note.entity';
import { LineupEntryEntity } from '../../entities/lineup-entry.entity';
import { PlayerEntity } from '../../entities/player.entity';
import { AttendanceEntity } from '../../entities/attendance.entity';
import { OpponentEntity } from '../../entities/opponent.entity';
import { PlayerAwardEntity } from '../../entities/player-award.entity';
import { PlayingTimeService } from '../../analytics/playing-time.service';
import { GeminiService } from './gemini.service';
import {
  MatchRecapTone,
  MatchRecapFormat,
  MatchRecapResponse,
  NextEventSummary,
} from '@apex-team/shared/util/models';
import { GenerateMatchRecapDto } from '../dto/generate-match-recap.dto';

interface CompiledMatchContext {
  teamName: string;
  sportName: string;
  opponentName: string;
  dateStr: string;
  timeStr: string;
  location: string;
  isHome: boolean;
  score: { team: number; opponent: number };
  result: 'Win' | 'Loss' | 'Draw';
  shootout?: { team: number; opponent: number; winner: 'team' | 'opponent' };
  goals: Array<{
    minute?: number;
    scorerName: string;
    scorerJersey?: number;
    assistName?: string;
    assistJersey?: number;
    isOpponent?: boolean;
    period?: number;
  }>;
  awards: Array<{
    playerName: string;
    playerJersey?: number;
    title: string;
    category: string;
    notes?: string;
  }>;
  volleyballStats?: {
    kills: number;
    aces: number;
    blocks: number;
    digs: number;
    errors: number;
  };
  keyStats: {
    shots: { team: number; opponent: number };
    corners: { team: number; opponent: number };
    saves: number;
    cleanSheet: boolean;
  };
  attendance: {
    presentPlayers: string[];
    absentPlayers: string[];
  };
  notablePerformances: string[];
  coachNotes: string[];
  opponentIntel?: {
    name: string;
    threatLevel?: string;
    tendencies?: string;
  };
  nextEvent?: NextEventSummary;
}

@Injectable()
export class MatchRecapService {
  private readonly logger = new Logger(MatchRecapService.name);

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    @InjectRepository(EventNoteEntity)
    private readonly eventNoteRepo: Repository<EventNoteEntity>,
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(OpponentEntity)
    private readonly opponentRepo: Repository<OpponentEntity>,
    @InjectRepository(PlayerAwardEntity)
    private readonly awardRepo: Repository<PlayerAwardEntity>,
    private readonly playingTimeService: PlayingTimeService,
    private readonly geminiService: GeminiService,
  ) {}

  async generateRecap(
    teamId: string,
    eventId: string,
    dto: GenerateMatchRecapDto,
  ): Promise<MatchRecapResponse> {
    const tone = dto.tone || 'youth_encouraging';
    const format = dto.format || 'email';
    const includeNextEvent = dto.includeNextEvent !== false;
    const includePlayerShoutouts = dto.includePlayerShoutouts !== false;

    // 1. Gather all structured match data
    const context = await this.compileMatchContext(teamId, eventId, includeNextEvent);

    // 2. Formulate Prompt & System Instruction
    const systemInstruction = this.buildSystemInstruction(tone, format);
    const prompt = this.buildPrompt(context, dto, tone, format, includePlayerShoutouts, includeNextEvent);

    const title = `${context.teamName} vs ${context.opponentName} - Match Recap`;
    const now = new Date().toISOString();

    // 3. Check if Gemini AI is available and not in dryRun mode
    if (!dto.dryRun && this.geminiService.isConfigured()) {
      try {
        const aiResult = await this.geminiService.generateText(prompt, systemInstruction);
        return {
          recap: aiResult.text,
          title,
          tone,
          format,
          prompt,
          isAiGenerated: true,
          model: aiResult.model,
          nextEvent: context.nextEvent,
          generatedAt: now,
        };
      } catch (aiError) {
        this.logger.error('Gemini API call failed, falling back to structured template generator', aiError);
      }
    }

    // 4. Fallback Template Generation (Resilient offline or missing API key)
    const fallbackRecap = this.generateFallbackTemplateRecap(context, dto, tone, format, includePlayerShoutouts, includeNextEvent);

    return {
      recap: fallbackRecap,
      title,
      tone,
      format,
      prompt,
      isAiGenerated: false,
      model: undefined,
      nextEvent: context.nextEvent,
      generatedAt: now,
    };
  }

  async getPromptOnly(
    teamId: string,
    eventId: string,
    dto: GenerateMatchRecapDto,
  ): Promise<{ prompt: string; systemInstruction: string; context: CompiledMatchContext }> {
    const tone = dto.tone || 'youth_encouraging';
    const format = dto.format || 'email';
    const includeNextEvent = dto.includeNextEvent !== false;
    const includePlayerShoutouts = dto.includePlayerShoutouts !== false;

    const context = await this.compileMatchContext(teamId, eventId, includeNextEvent);
    const systemInstruction = this.buildSystemInstruction(tone, format);
    const prompt = this.buildPrompt(context, dto, tone, format, includePlayerShoutouts, includeNextEvent);

    return { prompt, systemInstruction, context };
  }

  private async compileMatchContext(
    teamId: string,
    eventId: string,
    includeNextEvent: boolean,
  ): Promise<CompiledMatchContext> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['season', 'season.team', 'season.team.sport', 'opponentRef'],
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const team = event.season?.team;
    if (!team || team.id !== teamId) {
      throw new NotFoundException(`Event ${eventId} does not belong to team ${teamId}`);
    }

    const sportName = team.sport?.name || 'Soccer';
    const teamName = team.name || 'Apex Team';
    const opponentName = event.opponent || event.opponentRef?.name || 'Opponent';

    // Query team players to map names & numbers
    const allPlayers = await this.playerRepo.find({
      where: { teamId },
    });
    const playerMap = new Map<string, PlayerEntity>();
    allPlayers.forEach((p) => playerMap.set(p.id, p));

    // Query Game Events
    const gameEvents = await this.gameEventRepo.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });

    // Goals & Scorers
    const goals: CompiledMatchContext['goals'] = [];
    let teamShots = 0;
    let opponentShots = 0;
    let teamCorners = 0;
    let opponentCorners = 0;
    let saves = 0;
    let teamShootoutGoals = 0;
    let oppShootoutGoals = 0;
    let hasShootout = false;

    let kills = 0;
    let aces = 0;
    let blocks = 0;
    let digs = 0;
    let vbErrors = 0;

    let teamScore = event.goalsFor ?? 0;
    let oppScore = event.goalsAgainst ?? 0;

    // Calculate score from events if not stored on event entity
    let eventDerivedTeamGoals = 0;
    let eventDerivedOppGoals = 0;

    for (const ge of gameEvents) {
      const p = (ge.payload as any) || {};
      const isOpponent = p.isOpponent === true || p.team === 'opponent';

      switch (ge.eventType) {
        case 'goal':
        case 'GOAL': {
          if (isOpponent) {
            eventDerivedOppGoals++;
            goals.push({
              minute: ge.minuteOccurred,
              scorerName: opponentName,
              isOpponent: true,
              period: p.period,
            });
          } else {
            eventDerivedTeamGoals++;
            const player = p.playerId ? playerMap.get(p.playerId) : undefined;
            const assist = p.assistedByPlayerId || p.assistPlayerId ? playerMap.get(p.assistedByPlayerId || p.assistPlayerId) : undefined;
            goals.push({
              minute: ge.minuteOccurred,
              scorerName: player ? `${player.firstName} ${player.lastName}` : (p.playerName || 'Teammate'),
              scorerJersey: player?.jerseyNumber,
              assistName: assist ? `${assist.firstName} ${assist.lastName}` : (p.assistPlayerName || undefined),
              assistJersey: assist?.jerseyNumber,
              isOpponent: false,
              period: p.period,
            });
          }
          break;
        }
        case 'shot':
        case 'SHOT': {
          if (isOpponent) opponentShots++;
          else teamShots++;
          break;
        }
        case 'corner':
        case 'CORNER': {
          if (isOpponent) opponentCorners++;
          else teamCorners++;
          break;
        }
        case 'save':
        case 'SAVE': {
          saves++;
          break;
        }
        case 'shootout_goal':
        case 'SHOOTOUT_GOAL': {
          hasShootout = true;
          if (isOpponent) oppShootoutGoals++;
          else teamShootoutGoals++;
          break;
        }
        case 'shootout_miss':
        case 'SHOOTOUT_MISS': {
          hasShootout = true;
          break;
        }
        case 'kill':
        case 'KILL':
          kills++;
          break;
        case 'ace':
        case 'ACE':
          aces++;
          break;
        case 'block':
        case 'BLOCK':
          blocks++;
          break;
        case 'dig':
        case 'DIG':
          digs++;
          break;
        case 'error':
        case 'ERROR':
          vbErrors++;
          break;
      }
    }

    if (event.goalsFor != null) teamScore = event.goalsFor;
    else if (eventDerivedTeamGoals > 0 || eventDerivedOppGoals > 0) teamScore = eventDerivedTeamGoals;

    if (event.goalsAgainst != null) oppScore = event.goalsAgainst;
    else if (eventDerivedTeamGoals > 0 || eventDerivedOppGoals > 0) oppScore = eventDerivedOppGoals;

    let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
    if (teamScore > oppScore) result = 'Win';
    else if (teamScore < oppScore) result = 'Loss';
    else if (hasShootout) {
      result = teamShootoutGoals > oppShootoutGoals ? 'Win' : 'Loss';
    }

    // Attendance
    const attendances = await this.attendanceRepo.find({
      where: { eventId },
    });
    const presentPlayers: string[] = [];
    const absentPlayers: string[] = [];

    attendances.forEach((att) => {
      const pl = playerMap.get(att.playerId);
      if (pl) {
        const name = `${pl.firstName} ${pl.lastName}`.trim();
        if (att.status === 'present' || att.status === 'tardy') {
          presentPlayers.push(name);
        } else if (att.status === 'absent') {
          absentPlayers.push(name);
        }
      }
    });

    // Notable performances from playing time & stats
    const notablePerformances: string[] = [];
    try {
      const playtimeRecord = await this.playingTimeService.calculateForEvent(eventId);
      Object.entries(playtimeRecord).forEach(([pId, data]) => {
        const pl = playerMap.get(pId);
        if (pl && data.totalSeconds > 0) {
          const mins = Math.round(data.totalSeconds / 60);
          if (mins >= 40) {
            notablePerformances.push(`${pl.firstName} ${pl.lastName} (${mins} mins played)`);
          }
        }
      });
    } catch {
      // Ignore playtime errors gracefully
    }

    // Coach Notes
    const notesList = await this.eventNoteRepo.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
    const coachNotes = notesList.map((n) => n.content).filter(Boolean);
    if (event.notes && !coachNotes.includes(event.notes)) {
      coachNotes.unshift(event.notes);
    }

    // Opponent Intel
    let opponentIntel: CompiledMatchContext['opponentIntel'] = undefined;
    if (event.opponentRef) {
      opponentIntel = {
        name: event.opponentRef.name,
        threatLevel: event.opponentRef.threatLevel,
        tendencies: event.opponentRef.tendencies || undefined,
      };
    }

    // Next scheduled event
    let nextEventSummary: NextEventSummary | undefined = undefined;
    if (includeNextEvent) {
      try {
        const nowOrEvent = event.scheduledAt ? new Date(event.scheduledAt) : new Date();
        const nextEv = await this.eventRepo
          .createQueryBuilder('ev')
          .innerJoin('ev.season', 's')
          .where('s.teamId = :teamId', { teamId })
          .andWhere('ev.id != :currentId', { currentId: eventId })
          .andWhere('ev.scheduledAt > :afterDate', { afterDate: nowOrEvent })
          .orderBy('ev.scheduledAt', 'ASC')
          .getOne();

        if (nextEv) {
          nextEventSummary = {
            id: nextEv.id,
            type: nextEv.type,
            opponent: nextEv.opponent || undefined,
            scheduledAt: nextEv.scheduledAt ? new Date(nextEv.scheduledAt).toISOString() : '',
            location: nextEv.location || undefined,
            uniformColor: nextEv.uniformColor || undefined,
            arrivalMinutesBefore: nextEv.type === 'game' ? 30 : 15,
          };
        }
      } catch (err) {
        this.logger.warn('Failed to query next scheduled event', err);
      }
    }

    const scheduledDate = event.scheduledAt ? new Date(event.scheduledAt) : new Date();
    const dateStr = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = scheduledDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Match Honors & Badges
    const matchAwards = await this.awardRepo.find({
      where: { eventId },
      relations: ['player'],
      order: { createdAt: 'ASC' },
    });
    const awards = matchAwards.map((a) => ({
      playerName: `${a.player?.firstName || ''} ${a.player?.lastName || ''}`.trim(),
      playerJersey: a.player?.jerseyNumber ?? undefined,
      title: a.title,
      category: a.category,
      notes: a.notes || undefined,
    }));

    return {
      teamName,
      sportName,
      opponentName,
      dateStr,
      timeStr,
      location: event.location || 'Home Field',
      isHome: event.isHomeGame !== false,
      score: { team: teamScore, opponent: oppScore },
      result,
      shootout: hasShootout
        ? {
            team: teamShootoutGoals,
            opponent: oppShootoutGoals,
            winner: teamShootoutGoals > oppShootoutGoals ? 'team' : 'opponent',
          }
        : undefined,
      goals,
      awards,
      volleyballStats:
        sportName === 'Volleyball'
          ? { kills, aces, blocks, digs, errors: vbErrors }
          : undefined,
      keyStats: {
        shots: { team: teamShots, opponent: opponentShots },
        corners: { team: teamCorners, opponent: opponentCorners },
        saves,
        cleanSheet: oppScore === 0,
      },
      attendance: {
        presentPlayers,
        absentPlayers,
      },
      notablePerformances,
      coachNotes,
      opponentIntel,
      nextEvent: nextEventSummary,
    };
  }

  private buildSystemInstruction(tone: MatchRecapTone, format: MatchRecapFormat): string {
    const toneInstructions: Record<MatchRecapTone, string> = {
      youth_encouraging:
        'You are an inspiring, positive youth sports coach writing to parents and families. Your tone is supportive, energetic, empowering, and emphasizes sportsmanship, resilience, effort, and team camaraderie over just the final score.',
      developmental:
        'You are a high-level developmental sports coach. Your tone is growth-minded, instructional, and focused on tactical progression, player decision-making, practicing game concepts under pressure, and continuous improvement.',
      tactical_competitive:
        'You are an articulate, sharp athletic director and head coach. Your tone is analytical, crisp, confident, and focuses on match execution, defensive solidity, transitions, key momentum swings, and competitive excellence.',
    };

    const formatInstructions: Record<MatchRecapFormat, string> = {
      email:
        'Format the output as a professional, well-structured Parent Email / Newsletter. Include a subject line at the top (e.g., "Subject: Match Recap - [Team] vs [Opponent]"), a friendly opening, clear match summary paragraphs with bold highlights for key moments/players, an upcoming schedule reminder section, and a warm coach sign-off.',
      chat:
        'Format the output for a mobile team messaging app (WhatsApp, GroupMe, TeamSnap). Make it engaging, punchy, and scannable. Use appropriate sports emojis (⚽/🏐, 🔥, 🎯, 👏, 📅, 🏆), bullet points for highlights, and a quick summary of the next upcoming practice/game at the bottom.',
      sms:
        'Format the output as an ultra-concise SMS text alert (< 300 characters). Provide the score, one standout highlight or celebration sentence, and the next event date/time. Do not include lengthy paragraphs.',
      social:
        'Format the output as an exciting Social Media post (Instagram / Facebook caption). Include an attention-grabbing hook, the final score, key player shoutouts with sports emojis, high-energy team pride, and 4-6 relevant athletic hashtags at the bottom.',
    };

    return `${toneInstructions[tone]} ${formatInstructions[format]} Always maintain genuine coaching authenticity and avoid robotic clichés.`;
  }

  private buildPrompt(
    context: CompiledMatchContext,
    dto: GenerateMatchRecapDto,
    tone: MatchRecapTone,
    format: MatchRecapFormat,
    includePlayerShoutouts: boolean,
    includeNextEvent: boolean,
  ): string {
    const teamGoals = context.goals.filter((g) => !g.isOpponent);
    const goalSummary =
      teamGoals.length > 0
        ? teamGoals
            .map((g) => {
              let text = `- ${g.scorerName}${g.scorerJersey ? ` (#${g.scorerJersey})` : ''}`;
              if (g.minute) text += ` in minute ${g.minute}`;
              if (g.assistName) text += ` (Assist: ${g.assistName}${g.assistJersey ? ` #${g.assistJersey}` : ''})`;
              return text;
            })
            .join('\n')
        : '- No goals scored for our team';

    const awardsSummary =
      includePlayerShoutouts && context.awards.length > 0
        ? `\nMATCH HONORS & COACH BADGES AWARDED:\n` +
          context.awards
            .map(
              (a) =>
                `- 🏆 ${a.playerName}${a.playerJersey ? ` (#${a.playerJersey})` : ''}: Awarded "${a.title}" (${a.category.toUpperCase()})${a.notes ? ` - Coach's Praise: "${a.notes}"` : ''}`,
            )
            .join('\n')
        : '';

    let nextEventText = 'None scheduled';
    if (includeNextEvent && context.nextEvent) {
      const nextDate = new Date(context.nextEvent.scheduledAt);
      const dateFormatted = nextDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const timeFormatted = nextDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      nextEventText = `${context.nextEvent.type.toUpperCase()}: ${dateFormatted} at ${timeFormatted}`;
      if (context.nextEvent.location) nextEventText += ` (${context.nextEvent.location})`;
      if (context.nextEvent.uniformColor) nextEventText += ` | Uniform: ${context.nextEvent.uniformColor}`;
      if (context.nextEvent.arrivalMinutesBefore)
        nextEventText += ` | Arrival: ${context.nextEvent.arrivalMinutesBefore} mins prior`;
    }

    const coachObservations = [
      ...context.coachNotes,
      ...(dto.customCoachNotes ? [`Coach's specific custom note: "${dto.customCoachNotes}"`] : []),
    ];

    return `
Please generate a post-match recap with the following details:

MATCH DATA:
- Team: ${context.teamName}
- Opponent: ${context.opponentName}
- Sport: ${context.sportName}
- Date & Time: ${context.dateStr} at ${context.timeStr}
- Venue: ${context.location} (${context.isHome ? 'Home' : 'Away'})
- Final Score: ${context.teamName} ${context.score.team} - ${context.score.opponent} ${context.opponentName}
- Result: ${context.result.toUpperCase()}${context.shootout ? ` (Won penalty shootout ${context.shootout.team}-${context.shootout.opponent})` : ''}
${context.keyStats.cleanSheet ? '- Defensive Highlight: CLEAN SHEET achieved!' : ''}
${context.keyStats.saves > 0 ? `- Goalkeeper saves recorded: ${context.keyStats.saves}` : ''}

TEAM HIGHLIGHTS & GOALS:
${goalSummary}
${awardsSummary}

${
  context.volleyballStats
    ? `VOLLEYBALL STATS:
- Kills: ${context.volleyballStats.kills}
- Aces: ${context.volleyballStats.aces}
- Blocks: ${context.volleyballStats.blocks}
- Digs: ${context.volleyballStats.digs}
`
    : ''
}
${
  includePlayerShoutouts && context.attendance.presentPlayers.length > 0
    ? `ROSTER & ATTENDANCE:
- Players Present: ${context.attendance.presentPlayers.join(', ')}
${context.notablePerformances.length > 0 ? `- Standout Work Rate / High Minutes: ${context.notablePerformances.join(', ')}` : ''}`
    : ''
}

COACHING NOTES & OBSERVATIONS:
${coachObservations.length > 0 ? coachObservations.map((n) => `- ${n}`).join('\n') : '- Great hustle and spirited effort across both halves.'}

${
  includeNextEvent && context.nextEvent
    ? `NEXT SCHEDULED EVENT:
${nextEventText}`
    : ''
}

REQUIREMENTS:
1. Follow the ${tone.replace('_', ' ').toUpperCase()} tone and ${format.toUpperCase()} format.
2. ${includePlayerShoutouts ? 'Recognize team members positively for teamwork, hustle, and key moments.' : 'Keep the summary team-focused without listing individual player names.'}
3. If match honors or badges are listed above (like Player of the Match, Iron Defender, Relentless Motor, Ultimate Teammate, etc.), make sure to highlight and celebrate these specific honorees enthusiastically in the recap!
4. ${includeNextEvent && context.nextEvent ? 'Include the upcoming event reminder clearly.' : 'Do not include future scheduling.'}
5. Ensure the recap is immediately ready for the coach to copy and send to parents.
`.trim();
  }

  private generateFallbackTemplateRecap(
    context: CompiledMatchContext,
    dto: GenerateMatchRecapDto,
    tone: MatchRecapTone,
    format: MatchRecapFormat,
    includePlayerShoutouts: boolean,
    includeNextEvent: boolean,
  ): string {
    const outcomeWord = context.result === 'Win' ? 'victory' : context.result === 'Draw' ? 'hard-fought draw' : 'tough contest';
    const scoreStr = `${context.score.team}-${context.score.opponent}`;

    let nextEventSection = '';
    if (includeNextEvent && context.nextEvent) {
      const nextDate = new Date(context.nextEvent.scheduledAt);
      const formatted = `${nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      nextEventSection = `\n\n📅 **Upcoming Schedule Reminder:**\n- Next ${context.nextEvent.type}: **${formatted}**\n- Location: ${context.nextEvent.location || 'TBD'}\n- Uniform: ${context.nextEvent.uniformColor || 'Standard'}\n- Arrival: Please arrive ${context.nextEvent.arrivalMinutesBefore || 30} minutes prior for warmups.`;
    }

    const teamGoals = context.goals.filter((g) => !g.isOpponent);
    let highlightsText = '';
    if (includePlayerShoutouts && teamGoals.length > 0) {
      highlightsText = '\n\n**Match Highlights:**\n' + teamGoals
        .map((g) => `• ⚽ ${g.scorerName}${g.scorerJersey ? ` (#${g.scorerJersey})` : ''}${g.assistName ? ` (Assist: ${g.assistName})` : ''}`)
        .join('\n');
    }

    if (context.keyStats.cleanSheet) {
      highlightsText += '\n• 🛡️ Tremendous defensive lockdown and clean sheet!';
    }

    let awardsText = '';
    if (includePlayerShoutouts && context.awards.length > 0) {
      awardsText = '\n\n🏆 **Match Honors & Badges:**\n' + context.awards
        .map((a) => `• 🌟 ${a.playerName}${a.playerJersey ? ` (#${a.playerJersey})` : ''} — **${a.title}**${a.notes ? `: "${a.notes}"` : ''}`)
        .join('\n');
    }

    const customNote = dto.customCoachNotes ? `\n\n"${dto.customCoachNotes}"` : '';

    if (format === 'sms') {
      const nextSnippet = context.nextEvent ? ` Next: ${new Date(context.nextEvent.scheduledAt).toLocaleDateString('en-US', { weekday: 'short' })}` : '';
      const topHonoree = context.awards.length > 0 ? ` Congrats ${context.awards[0].playerName} on ${context.awards[0].title}!` : '';
      return `${context.teamName} ${context.result === 'Win' ? 'wins' : context.result === 'Draw' ? 'draws' : 'falls'} ${scoreStr} vs ${context.opponentName}!${topHonoree} Proud of the team's effort today.${nextSnippet}`;
    }

    if (format === 'chat') {
      return `⚽ **Game Recap: ${context.teamName} vs ${context.opponentName}** 🔥\n\nFinal Score: **${context.teamName} ${scoreStr} ${context.opponentName}** (${context.result.toUpperCase()})${highlightsText}${awardsText}${customNote}\n\nProud of everyone's hustle and teamwork today! 👏${nextEventSection}`;
    }

    if (format === 'social') {
      return `Final from ${context.location}: ${context.teamName} with a ${outcomeWord} against ${context.opponentName} (${scoreStr})! ⚽🔥\n\nProud of the entire squad for the relentless work rate from whistle to whistle. 👏${highlightsText}${awardsText}\n\n#${context.teamName.replace(/\s+/g, '')} #ApexTeam #GameDay #Teamwork #YouthSports`;
    }

    // Default: Email format
    return `Subject: Match Recap: ${context.teamName} vs ${context.opponentName} (${scoreStr})\n\nHi ${context.teamName} Families,\n\nThank you to everyone who came out to support the squad today against ${context.opponentName}. It was an exciting match from start to finish, ending in a ${outcomeWord} (${scoreStr}).\n\nThe players showed tremendous effort, teamwork, and resilience on the pitch. Every player contributed with great hustle and focus.${highlightsText}${awardsText}${customNote}\n\nThank you again for all the sideline encouragement and positive energy!${nextEventSection}\n\nBest regards,\nCoach & Coaching Staff`;
  }
}
