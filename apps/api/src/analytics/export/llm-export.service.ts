import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TeamEntity } from '../../entities/team.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { LeagueEntity } from '../../entities/league.entity';
import { PlayerEntity } from '../../entities/player.entity';
import { EventEntity } from '../../entities/event.entity';
import { GameEventEntity } from '../../entities/game-event.entity';
import { AttendanceEntity } from '../../entities/attendance.entity';
import { PracticeDrillEntity } from '../../entities/practice-drill.entity';
import { DrillEntity } from '../../entities/drill.entity';
import { EventNoteEntity } from '../../entities/event-note.entity';
import { PlayingTimeService } from '../playing-time.service';
import { PerformanceMetricsService, PlayerPerformanceMetrics } from '../performance-metrics.service';
import { LlmExportOptionsDto, LlmPromptTemplate } from '../dto/llm-export-options.dto';

export interface LlmExportResult {
  prompt: string;
  title: string;
  template: LlmPromptTemplate;
  metadata: {
    teamName: string;
    sport: string;
    seasonName?: string;
    leagueName?: string;
    gameCount: number;
    practiceCount: number;
    playerCount: number;
    generatedAt: string;
  };
}

@Injectable()
export class LlmExportService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(SeasonEntity)
    private readonly seasonRepo: Repository<SeasonEntity>,
    @InjectRepository(LeagueEntity)
    private readonly leagueRepo: Repository<LeagueEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(PracticeDrillEntity)
    private readonly practiceDrillRepo: Repository<PracticeDrillEntity>,
    @InjectRepository(DrillEntity)
    private readonly drillRepo: Repository<DrillEntity>,
    @InjectRepository(EventNoteEntity)
    private readonly eventNoteRepo: Repository<EventNoteEntity>,
    private readonly playingTimeService: PlayingTimeService,
    private readonly performanceMetricsService: PerformanceMetricsService,
  ) {}

  async generate(teamId: string, options: LlmExportOptionsDto): Promise<LlmExportResult> {
    const template = options.template || LlmPromptTemplate.PRACTICE_PLAN;

    // Fetch team with sport
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['sport'],
    });
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);

    let season: SeasonEntity | null = null;
    if (options.seasonId) {
      season = await this.seasonRepo.findOne({ where: { id: options.seasonId, teamId } });
    }

    let league: LeagueEntity | null = null;
    if (options.leagueId) {
      league = await this.leagueRepo.findOne({ where: { id: options.leagueId } });
    }

    // Fetch all players on team
    const players = await this.playerRepo.find({
      where: { teamId },
      order: { jerseyNumber: 'ASC', lastName: 'ASC', firstName: 'ASC' },
    });

    // Query seasons for team
    const teamSeasons = await this.seasonRepo.find({ where: { teamId } });
    const teamSeasonIds = teamSeasons.map((s) => s.id);

    let allEvents: EventEntity[] = [];
    if (options.leagueId) {
      allEvents = await this.eventRepo.find({
        where: { leagueId: options.leagueId },
        relations: ['league', 'locationRef', 'season'],
        order: { scheduledAt: 'DESC' },
      });
    } else if (options.seasonId) {
      allEvents = await this.eventRepo.find({
        where: { seasonId: options.seasonId },
        relations: ['league', 'locationRef', 'season'],
        order: { scheduledAt: 'DESC' },
      });
    } else if (teamSeasonIds.length > 0) {
      allEvents = await this.eventRepo.find({
        where: { seasonId: In(teamSeasonIds) },
        relations: ['league', 'locationRef', 'season'],
        order: { scheduledAt: 'DESC' },
      });
    }

    let games = allEvents.filter((e) => e.type === 'game');
    const practices = allEvents.filter((e) => e.type === 'practice');

    // Filter by opponent if requested
    if (options.opponent) {
      const oppLower = options.opponent.toLowerCase();
      games = games.filter((g) => g.opponent && g.opponent.toLowerCase().includes(oppLower));
    }

    // Apply game limit if requested (e.g. last 3 or 5 games)
    if (options.limitGames && options.limitGames > 0) {
      games = games.slice(0, options.limitGames);
    }

    const eventIds = [...games.map((g) => g.id), ...practices.map((p) => p.id)];

    // Fetch practice drills directly and attach to practices
    const allPracticeDrills =
      (eventIds.length > 0
        ? await this.practiceDrillRepo.find({
            where: { eventId: In(eventIds) },
            relations: ['drill', 'drill.tags'],
            order: { sequence: 'ASC' },
          })
        : []) || [];

    practices.forEach((prac) => {
      prac.practiceDrills = allPracticeDrills.filter((pd) => pd.eventId === prac.id);
    });

    // Fetch notes directly and attach to events
    const allNotes =
      (eventIds.length > 0
        ? await this.eventNoteRepo.find({
            where: { eventId: In(eventIds) },
            relations: ['user'],
            order: { createdAt: 'ASC' },
          })
        : []) || [];

    [...games, ...practices].forEach((e) => {
      e.notesList = allNotes.filter((n) => n.eventId === e.id);
    });

    // Fetch game events
    const gameEvents =
      (eventIds.length > 0
        ? await this.gameEventRepo.find({
            where: { eventId: In(eventIds) },
            order: { createdAt: 'ASC' },
          })
        : []) || [];

    // Fetch attendance
    const attendance =
      (eventIds.length > 0
        ? await this.attendanceRepo.find({
            where: { eventId: In(eventIds) },
          })
        : []) || [];

    // Fetch metrics & playtime
    const playerMetrics = await this.performanceMetricsService.getTeamMetrics(
      teamId,
      options.seasonId,
      options.leagueId,
      'all',
    );

    const playtimeMap = await this.playingTimeService.calculateForTeam(
      teamId,
      options.seasonId,
      options.leagueId,
    );

    // Build markdown content
    const prompt = this.buildPromptDocument({
      team,
      season,
      league,
      players,
      games,
      practices,
      gameEvents,
      attendance,
      playerMetrics,
      playtimeMap,
      options,
      template,
    });

    const title = this.getPromptTitle(template, team.name);

    return {
      prompt,
      title,
      template,
      metadata: {
        teamName: team.name,
        sport: team.sport?.name || 'Soccer',
        seasonName: season?.name,
        leagueName: league?.name,
        gameCount: games.length,
        practiceCount: practices.length,
        playerCount: players.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private getPromptTitle(template: LlmPromptTemplate, teamName: string): string {
    switch (template) {
      case LlmPromptTemplate.PRACTICE_PLAN:
        return `${teamName} - Practice Plan Generator Prompt`;
      case LlmPromptTemplate.GAME_STRATEGY:
        return `${teamName} - Game Strategy & Lineup Optimizer Prompt`;
      case LlmPromptTemplate.SEASON_DEBRIEF:
        return `${teamName} - Season & Tournament Debrief Prompt`;
      case LlmPromptTemplate.PLAYER_EVAL:
        return `${teamName} - Player Evaluation & Feedback Prompt`;
      case LlmPromptTemplate.DRILL_RECOMMENDER:
        return `${teamName} - Custom Drill Recommender Prompt`;
      case LlmPromptTemplate.OPPONENT_SCOUTING:
        return `${teamName} - Opponent Scouting & Matchup Prep Prompt`;
      case LlmPromptTemplate.CUSTOM:
      default:
        return `${teamName} - AI Coaching Dossier`;
    }
  }

  private buildPromptDocument(ctx: {
    team: TeamEntity;
    season: SeasonEntity | null;
    league: LeagueEntity | null;
    players: PlayerEntity[];
    games: EventEntity[];
    practices: EventEntity[];
    gameEvents: GameEventEntity[];
    attendance: AttendanceEntity[];
    playerMetrics: PlayerPerformanceMetrics[];
    playtimeMap: Record<string, any>;
    options: LlmExportOptionsDto;
    template: LlmPromptTemplate;
  }): string {
    const sections: string[] = [];

    // 1. System Prompt & Task Objective
    sections.push(this.renderSystemInstruction(ctx));

    // 2. Custom Coach Instructions (if provided)
    if (ctx.options.customInstructions && ctx.options.customInstructions.trim().length > 0) {
      sections.push(`## Coach Focus & Specific Instructions\n${ctx.options.customInstructions.trim()}\n`);
    }

    // 3. Team & Roster Context
    sections.push(this.renderTeamContext(ctx));

    // 4. Match Logs & In-Game Breakdown (sorted chronological for the LLM)
    if (ctx.games.length > 0) {
      sections.push(this.renderMatchLogs(ctx));
    }

    // 5. Playing Time & Positional Matrix
    if (ctx.players.length > 0) {
      sections.push(this.renderPlaytimeAndPositions(ctx));
    }

    // 6. Practice History, Drill Ratings & Skill Distribution
    if (ctx.practices.length > 0) {
      sections.push(this.renderPracticeHistory(ctx));
    }

    // 7. Attendance & Player Commitment
    if (ctx.attendance.length > 0) {
      sections.push(this.renderAttendanceSummary(ctx));
    }

    // 8. Individual Player Profile Deep-Dive (for player eval template or single player filter)
    if (ctx.template === LlmPromptTemplate.PLAYER_EVAL || ctx.options.playerId) {
      sections.push(this.renderPlayerDossiers(ctx));
    }

    // 9. Concluding Guidance
    sections.push(this.renderConcludingGuidance(ctx.template));

    return sections.join('\n\n---\n\n');
  }

  private renderSystemInstruction(ctx: {
    team: TeamEntity;
    template: LlmPromptTemplate;
    options: LlmExportOptionsDto;
  }): string {
    const sportName = ctx.team.sport?.name || 'Soccer';

    switch (ctx.template) {
      case LlmPromptTemplate.PRACTICE_PLAN:
        return `# System Role: Master Youth ${sportName} Tactical Coach & Technical Director

You are an expert ${sportName.toLowerCase()} coach specializing in youth player development and match performance analysis.
Review the match logs, goal timelines, coach notes, drill history with team ratings, and roster data below.

## Your Task:
1. **Analyze Recent Match Breakdowns & Trends**: Identify the top 2-3 technical or tactical recurring weaknesses (e.g. conceding late in the second half, slow midfield ball progression, transitional defending).
2. **Design a Comprehensive 75-90 Minute Training Session**:
   - **Phase 1 (Warmup & Activation, 15 min)**: Dynamic warmup and technical repetition related to the session theme.
   - **Phase 2 (Technical Progression / Position Play, 20 min)**: Unopposed to light-pressure drill with clear coaching points.
   - **Phase 3 (Tactical Game / Small-Sided Game, 25 min)**: Directional game with constraints (e.g. touch limits, scoring zones) reinforcing the theme.
   - **Phase 4 (Match Scrimmage, 20 min)**: Free play with tactical checkpoints and freeze moments.
   - **Phase 5 (Cool Down & Debrief, 5 min)**: Key discussion questions for the players.
3. **Provide 3 Concrete Coaching Points** per drill that the coach can shout during the flow of practice.`;

      case LlmPromptTemplate.GAME_STRATEGY:
        return `# System Role: Youth ${sportName} Matchday Strategist & Tactical Analyst

You are an expert game-day coach assistant for a youth ${sportName.toLowerCase()} team.
Review the available roster, preferred positions, historical playing time balance, sub patterns, and opponent history below.

## Your Task:
1. **Starting Formation & Lineup**: Propose an optimal starting lineup that matches player positional strengths while maintaining tactical balance.
2. **Minute-by-Minute Substitution Plan**:
   - Create a clear sub rotation matrix across periods/halves.
   - Ensure equitable playing time across all active rostered players while preserving a solid defensive spine.
   - Anticipate fatigue management if playing multiple games in a tournament.
3. **Tactical Game Plan**:
   - In-possession principles (buildup, attacking third).
   - Out-of-possession principles (pressing triggers, defensive recovery).
   - Halftime adjustment triggers (what to change if trailing or defending a lead).`;

      case LlmPromptTemplate.SEASON_DEBRIEF:
        return `# System Role: Director of Coaching & Sports Analytics Specialist

You are an elite youth sports director conducting a comprehensive season/tournament retrospective for ${ctx.team.name}.
Review the match history, goal timing breakdowns, player minutes distribution, drill ratings, and coach qualitative notes below.

## Your Task:
1. **Executive Performance Summary**: Overall record, goal differential patterns, and key milestones.
2. **Tactical & Flow Analysis**:
   - 1st Half vs 2nd Half performance trends (goal timing, energy, composure).
   - Set piece and transitional phase effectiveness.
3. **Player Development & Playing Time Equity**:
   - Assessment of minutes distribution fairness and positional versatility.
   - Individual standouts and players showing significant progression.
4. **Curriculum & Training Efficacy**:
   - Which practice drills translated to game day success.
   - Which training areas were underrepresented or received low drill ratings.
5. **Action Plan for Next Season / Tournament**: 3 highest-priority focus areas.`;

      case LlmPromptTemplate.PLAYER_EVAL:
        return `# System Role: Youth Sports Development Coach & Player Mentor

You are a supportive, insightful youth ${sportName.toLowerCase()} coach providing constructive player evaluations and developmental roadmaps.
Review the detailed player profiles, minutes played, positions played, event logs, and coach notes below.

## Your Task:
1. **Player Overview & Contributions**: Summarize what each player brings to the team (attitude, reliability, technical strengths).
2. **Positional Versatility**: Evaluate their effectiveness across positions played.
3. **Strengths & Growth Areas**: Highlight 2 key strengths and 2 actionable development goals with specific training recommendations.
4. **Parent/Player Communication Summary**: Provide a 2-paragraph positive, empowering summary ready to share in player reviews or parent meetings.`;

      case LlmPromptTemplate.DRILL_RECOMMENDER:
        return `# System Role: Youth ${sportName} Curriculum & Drill Specialist

You are an expert soccer curriculum designer with an extensive catalog of modern, engaging training drills.
Review the recent match weaknesses, coach notes, and practice drill ratings below.

## Your Task:
1. **Identify Root Skill Deficits**: Diagnose the core mechanical or tactical issues leading to match breakdowns or low drill ratings.
2. **Recommend 5 Progressive Training Drills**:
   - Drill Title & Target Skill Category (e.g. #pressing, #passing, #finishing).
   - Setup & Grid Dimensions.
   - Rules, Constraints & Scoring System.
   - Step-by-Step Progression (from basic to game-realistic).
   - Key Coaching Cues and Common Player Mistakes to correct.`;

      case LlmPromptTemplate.OPPONENT_SCOUTING:
        return `# System Role: Tactical Opposition Scout & Youth ${sportName} Match Prep Specialist

You are a tactical scout preparing ${ctx.team.name} for an upcoming clash against ${ctx.options.opponent || 'an upcoming opponent'}.
Review previous encounter logs, scorelines, goal timelines, and coach observations below.

## Your Task:
1. **Historical Matchup Analysis**: What patterns emerged in previous games against this team (strengths to neutralize, vulnerabilities to exploit).
2. **Defensive Strategy**: How to organize the defensive block against their attacking threats.
3. **Attacking Strategy**: How to break down their defense and create high-percentage scoring chances.
4. **Matchday Checklist**: 3 non-negotiable team keys to victory.`;

      case LlmPromptTemplate.CUSTOM:
      default:
        return `# System Role: Expert Youth ${sportName} Coaching Consultant & Analyst

You are an elite coaching consultant helping the coach of ${ctx.team.name} with game day preparation, practice planning, and player development.
Use the comprehensive team dossier provided below to answer the coach's inquiry with precision, tactical depth, and actionable advice.`;
    }
  }

  private renderTeamContext(ctx: {
    team: TeamEntity;
    season: SeasonEntity | null;
    league: LeagueEntity | null;
    players: PlayerEntity[];
    games: EventEntity[];
    practices: EventEntity[];
  }): string {
    const sportName = ctx.team.sport?.name || 'Soccer';
    const lines: string[] = [];

    lines.push(`## Team Context`);
    lines.push(`- **Team Name**: ${ctx.team.name}`);
    lines.push(`- **Sport**: ${sportName}`);
    if (ctx.season) lines.push(`- **Season**: ${ctx.season.name}`);
    if (ctx.league) lines.push(`- **Competition / League / Tournament**: ${ctx.league.name}`);
    lines.push(`- **Total Games Analyzed**: ${ctx.games.length}`);
    lines.push(`- **Total Practices Analyzed**: ${ctx.practices.length}`);
    lines.push(`- **Roster Size**: ${ctx.players.length} players`);

    lines.push(`\n### Active Roster`);
    lines.push(`| # | Player Name | Preferred Position | Status |`);
    lines.push(`| :---: | :--- | :--- | :---: |`);

    for (const p of ctx.players) {
      const num = p.jerseyNumber !== null && p.jerseyNumber !== undefined ? `#${p.jerseyNumber}` : '-';
      const pos = p.preferredPosition || 'Unspecified';
      const status = p.isGuest ? 'Guest' : p.isActive === false ? 'Stepped Away' : 'Active';
      lines.push(`| ${num} | ${p.firstName} ${p.lastName} | ${pos} | ${status} |`);
    }

    return lines.join('\n');
  }

  private renderMatchLogs(ctx: {
    games: EventEntity[];
    gameEvents: GameEventEntity[];
    players: PlayerEntity[];
  }): string {
    const lines: string[] = [];
    lines.push(`## Match Logs & Event Timelines`);

    // Sort chronological (oldest to newest) for storytelling
    const sortedGames = [...ctx.games].sort((a, b) => {
      const timeA = new Date(a.scheduledAt || 0).getTime();
      const timeB = new Date(b.scheduledAt || 0).getTime();
      return timeA - timeB;
    });

    let totalWins = 0;
    let totalLosses = 0;
    let totalDraws = 0;
    let totalGoalsFor = 0;
    let totalGoalsAgainst = 0;

    sortedGames.forEach((g) => {
      const gf = g.goalsFor ?? 0;
      const ga = g.goalsAgainst ?? 0;
      totalGoalsFor += gf;
      totalGoalsAgainst += ga;
      if (gf > ga) totalWins++;
      else if (gf < ga) totalLosses++;
      else totalDraws++;
    });

    lines.push(`**Overall Record in Sample**: ${totalWins}W - ${totalLosses}L - ${totalDraws}D | Goals: ${totalGoalsFor} For, ${totalGoalsAgainst} Against (Diff: ${totalGoalsFor - totalGoalsAgainst >= 0 ? '+' : ''}${totalGoalsFor - totalGoalsAgainst})\n`);

    sortedGames.forEach((game, idx) => {
      const dateStr = game.scheduledAt ? new Date(game.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
      const opp = game.opponent || 'Unknown Opponent';
      const homeAway = game.isHomeGame ? 'Home' : 'Away';
      const scoreStr = game.goalsFor !== null && game.goalsAgainst !== null ? `${game.goalsFor} - ${game.goalsAgainst}` : 'Incomplete / No Score';
      const outcome = game.goalsFor !== null && game.goalsAgainst !== null
        ? game.goalsFor > game.goalsAgainst
          ? 'WIN'
          : game.goalsFor < game.goalsAgainst
            ? 'LOSS'
            : 'DRAW'
        : 'N/A';

      lines.push(`### Game ${idx + 1}: vs ${opp} (${outcome} ${scoreStr})`);
      lines.push(`- **Date**: ${dateStr} | **Location**: ${game.location || game.locationRef?.name || 'TBD'} (${homeAway})`);
      if (game.durationMinutes) lines.push(`- **Duration**: ${game.durationMinutes} min (${game.periodCount || 2} periods of ${game.periodLengthMinutes || 25} min)`);
      if (game.weatherData?.condition || game.weatherData?.temperature) {
        lines.push(`- **Weather**: ${game.weatherData.temperature}°F, ${game.weatherData.condition || 'Clear'}`);
      }

      // Filter events for this game
      const events = ctx.gameEvents.filter((ge) => ge.eventId === game.id);
      if (events.length > 0) {
        lines.push(`\n**In-Game Key Events Timeline**:`);
        events.forEach((ge) => {
          const payload = (ge.payload as any) || {};
          const min = ge.minuteOccurred ? `${ge.minuteOccurred}'` : `Period ${payload.period || 1}`;
          const player = ctx.players.find((p) => p.id === (payload.scorerId || payload.playerId));
          const assistor = payload.assistorId ? ctx.players.find((p) => p.id === payload.assistorId) : null;
          const playerName = player ? `${player.firstName} ${player.lastName}` : 'Player';
          const assistName = assistor ? ` (Assist: ${assistor.firstName} ${assistor.lastName})` : '';

          if (ge.eventType === 'GOAL') {
            lines.push(`  - ⚽ **${min} GOAL**: Scored by ${playerName}${assistName}`);
          } else if (ge.eventType === 'YELLOW_CARD' || (ge.eventType === 'CARD' && payload.color === 'yellow')) {
            lines.push(`  - 🟨 **${min} Yellow Card**: ${playerName}`);
          } else if (ge.eventType === 'RED_CARD' || (ge.eventType === 'CARD' && payload.color === 'red')) {
            lines.push(`  - 🟥 **${min} Red Card**: ${playerName}`);
          } else if (ge.eventType === 'BLOCKED_SHOT' || ge.eventType === 'BLOCKED_PENALTY') {
            lines.push(`  - 🧤 **${min} Save / Blocked Shot**: ${playerName}`);
          } else if (ge.eventType === 'KILL' || ge.eventType === 'ACE' || ge.eventType === 'BLOCK') {
            lines.push(`  - 🏐 **${min} ${ge.eventType}**: ${playerName}`);
          }
        });
      }

      // Coach Notes
      const notesList = game.notesList || [];
      const hasDirectNotes = game.notes && game.notes.trim().length > 0;
      if (hasDirectNotes || notesList.length > 0) {
        lines.push(`\n**Coach Observations & Notes**:`);
        if (hasDirectNotes) {
          lines.push(`  > ${game.notes?.trim()}`);
        }
        notesList.forEach((n) => {
          lines.push(`  > *${n.user?.displayName || 'Coach'}*: ${n.content}`);
        });
      }

      lines.push('');
    });

    return lines.join('\n');
  }

  private renderPlaytimeAndPositions(ctx: {
    players: PlayerEntity[];
    playtimeMap: Record<string, any>;
    playerMetrics: PlayerPerformanceMetrics[];
  }): string {
    const lines: string[] = [];
    lines.push(`## Player Playing Time & Positional Distribution`);
    lines.push(`| Player | Total Min | GK % | DEF % | MID % | FWD % | Goals | Assists | Games |`);
    lines.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |`);

    for (const p of ctx.players) {
      const pt = ctx.playtimeMap[p.id] || { totalSeconds: 0, positionSeconds: {} };
      const totalMin = Math.round((pt.totalSeconds || 0) / 60);
      const posSec = pt.positionSeconds || {};
      const totalSec = pt.totalSeconds || 1;

      const gkPct = Math.round(((posSec['GK'] || 0) / totalSec) * 100);
      const defPct = Math.round(((posSec['DEF'] || 0) / totalSec) * 100);
      const midPct = Math.round(((posSec['MID'] || 0) / totalSec) * 100);
      const fwdPct = Math.round(((posSec['FWD'] || 0) / totalSec) * 100);

      const metric = ctx.playerMetrics.find((m) => m.playerId === p.id);
      const goals = metric?.goals || 0;
      const assists = metric?.assists || 0;
      const games = metric?.gamesPlayed || 0;

      lines.push(
        `| ${p.firstName} ${p.lastName} | ${totalMin}m | ${gkPct}% | ${defPct}% | ${midPct}% | ${fwdPct}% | ${goals} | ${assists} | ${games} |`,
      );
    }

    return lines.join('\n');
  }

  private renderPracticeHistory(ctx: {
    practices: EventEntity[];
  }): string {
    const lines: string[] = [];
    lines.push(`## Practice Logs & Drill Effectiveness`);

    const sortedPractices = [...ctx.practices].sort((a, b) => {
      const timeA = new Date(a.scheduledAt || 0).getTime();
      const timeB = new Date(b.scheduledAt || 0).getTime();
      return timeA - timeB;
    });

    const tagCounts: Record<string, { minutes: number; count: number; ratingSum: number; ratingCount: number }> = {};

    sortedPractices.forEach((prac, idx) => {
      const dateStr = prac.scheduledAt ? new Date(prac.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
      lines.push(`### Practice ${idx + 1}: ${dateStr} (${prac.durationMinutes || 60} min)`);
      if (prac.notes && prac.notes.trim().length > 0) {
        lines.push(`- **Session Focus / Note**: ${prac.notes.trim()}`);
      }

      const drills = (prac.practiceDrills || []).sort((a, b) => a.sequence - b.sequence);
      if (drills.length > 0) {
        lines.push(`\n**Drills Executed**:`);
        drills.forEach((pd) => {
          const name = pd.customName || pd.drill?.name || 'Drill';
          const rating = pd.teamRating ? `${pd.teamRating}/5 ⭐` : 'Unrated';
          const duration = pd.durationMinutes ? `${pd.durationMinutes} min` : 'Duration N/A';
          const tags = pd.drill?.tags?.map((t) => `#${t.name}`).join(' ') || '';
          const drillNote = pd.notes ? ` — Note: "${pd.notes}"` : '';

          lines.push(`  - **${pd.sequence + 1}. ${name}** (${duration}, Rating: ${rating}) ${tags}${drillNote}`);

          // Track tag aggregates
          if (pd.drill?.tags) {
            pd.drill.tags.forEach((t) => {
              if (!tagCounts[t.name]) {
                tagCounts[t.name] = { minutes: 0, count: 0, ratingSum: 0, ratingCount: 0 };
              }
              tagCounts[t.name].minutes += pd.durationMinutes || 0;
              tagCounts[t.name].count++;
              if (pd.teamRating) {
                tagCounts[t.name].ratingSum += pd.teamRating;
                tagCounts[t.name].ratingCount++;
              }
            });
          }
        });
      }

      lines.push('');
    });

    // Skill Tag Aggregate Summary
    if (Object.keys(tagCounts).length > 0) {
      lines.push(`### Training Time by Skill Category`);
      lines.push(`| Skill Category | Total Time | Drills Run | Avg Team Rating |`);
      lines.push(`| :--- | :---: | :---: | :---: |`);
      Object.entries(tagCounts)
        .sort((a, b) => b[1].minutes - a[1].minutes)
        .forEach(([tag, stat]) => {
          const avgRating = stat.ratingCount > 0 ? `${(stat.ratingSum / stat.ratingCount).toFixed(1)}/5 ⭐` : 'N/A';
          lines.push(`| #${tag} | ${stat.minutes} min | ${stat.count} | ${avgRating} |`);
        });
    }

    return lines.join('\n');
  }

  private renderAttendanceSummary(ctx: {
    players: PlayerEntity[];
    attendance: AttendanceEntity[];
    games: EventEntity[];
    practices: EventEntity[];
  }): string {
    const lines: string[] = [];
    lines.push(`## Attendance & Reliability Summary`);
    lines.push(`| Player | Total Events | Practices Attended | Games Attended | Overall % |`);
    lines.push(`| :--- | :---: | :---: | :---: | :---: |`);

    const gameIds = new Set(ctx.games.map((g) => g.id));
    const pracIds = new Set(ctx.practices.map((p) => p.id));
    const totalEvents = ctx.games.length + ctx.practices.length;

    for (const p of ctx.players) {
      const records = ctx.attendance.filter((a) => a.playerId === p.id);
      const pracAtt = records.filter(
        (r) => pracIds.has(r.eventId) && (r.status === 'present' || r.status === 'tardy'),
      ).length;
      const gameAtt = records.filter(
        (r) => gameIds.has(r.eventId) && (r.status === 'present' || r.status === 'tardy'),
      ).length;
      const totalAtt = pracAtt + gameAtt;
      const pct = totalEvents > 0 ? Math.round((totalAtt / totalEvents) * 100) : 100;

      lines.push(
        `| ${p.firstName} ${p.lastName} | ${totalEvents} | ${pracAtt}/${ctx.practices.length} | ${gameAtt}/${ctx.games.length} | ${pct}% |`,
      );
    }

    return lines.join('\n');
  }

  private renderPlayerDossiers(ctx: {
    players: PlayerEntity[];
    options: LlmExportOptionsDto;
    playtimeMap: Record<string, any>;
    playerMetrics: PlayerPerformanceMetrics[];
    attendance: AttendanceEntity[];
    games: EventEntity[];
    practices: EventEntity[];
  }): string {
    const lines: string[] = [];
    lines.push(`## Individual Player Development Profiles`);

    const targetPlayers = ctx.options.playerId
      ? ctx.players.filter((p) => p.id === ctx.options.playerId)
      : ctx.players;

    for (const p of targetPlayers) {
      const pt = ctx.playtimeMap[p.id] || { totalSeconds: 0, positionSeconds: {} };
      const totalMin = Math.round((pt.totalSeconds || 0) / 60);
      const metric = ctx.playerMetrics.find((m) => m.playerId === p.id);
      const posSec = pt.positionSeconds || {};
      const posBreakdown = Object.entries(posSec)
        .map(([pos, sec]) => `${pos}: ${Math.round((sec as number) / 60)}m`)
        .join(', ') || 'No positional time logged';

      lines.push(`### Player Dossier: ${p.firstName} ${p.lastName} (#${p.jerseyNumber || 'N/A'})`);
      lines.push(`- **Preferred Position**: ${p.preferredPosition || 'Flexible / Unspecified'}`);
      lines.push(`- **Total Minutes Played**: ${totalMin} min across ${metric?.gamesPlayed || 0} games`);
      lines.push(`- **Positions Played**: ${posBreakdown}`);
      lines.push(`- **Match Stats**: ${metric?.goals || 0} Goals, ${metric?.assists || 0} Assists, ${metric?.blockedShots || 0} Blocked Shots, ${metric?.yellowCards || 0} Yellow Cards`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private renderConcludingGuidance(template: LlmPromptTemplate): string {
    return `## Response Format Guidelines
- Respond in clear, professional Markdown format with bold headings and structured bullet points.
- Ground all recommendations directly in the provided match data, coach notes, and drill ratings above.
- Be concise, tactical, and immediately applicable on the training pitch or matchday.`;
  }
}
