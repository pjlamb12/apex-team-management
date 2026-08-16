import { InitialSchema1744934400000 } from './1744934400000-InitialSchema';
import { AddAuthColumns1744990000000 } from './1744990000000-AddAuthColumns';
import { MoveFormatFieldsToSeasons1745020800000 } from './1745020800000-MoveFormatFieldsToSeasons';
import { AddParentEmailToPlayer1776466961975 } from './1776466961975-AddParentEmailToPlayer';
import { GamesLineupPhase1776489800000 } from './1776489800000-GamesLineupPhase';
import { AddEventDefinitionsToSport1776510000000 } from './1776510000000-AddEventDefinitionsToSport';
import { AddOpponentGoalEvent1776580000000 } from './1776580000000-AddOpponentGoalEvent';
import { SeasonDefaultsAndSlots1776664695002 } from './1776664695002-SeasonDefaultsAndSlots';
import { AddPracticeLocationToSeason1776696865998 } from './1776696865998-AddPracticeLocationToSeason';
import { EventsRefactor1776700000000 } from './1776700000000-EventsRefactor';
import { AddScoreToEvents1776800000000 } from './1776800000000-AddScoreToEvents';
import { AdvancedGameManagement1776850000000 } from './1776850000000-AdvancedGameManagement';
import { DrillLibraryFoundation1776910000000 } from './1776910000000-DrillLibraryFoundation';
import { CreatePracticeDrills1776925799677 } from './1776925799677-CreatePracticeDrills';
import { AddPlayersOnFieldToEvents1777100000000 } from './1777100000000-AddPlayersOnFieldToEvents';
import { TeamMemberships1777200000000 } from './1777200000000-TeamMemberships';
import { AddSchedulingAndWeather1777704365283 } from './1777704365283-AddSchedulingAndWeather';
import { AddTeamIdToLocations1777780603397 } from './1777780603397-AddTeamIdToLocations';
import { UpdateSoccerEventDefinitions1778000000000 } from './1778000000000-UpdateSoccerEventDefinitions';
import { CreateAttendance1778100000000 } from './1778100000000-CreateAttendance';
import { AddCreatedAtToGameEvents1778200000000 } from './1778200000000-AddCreatedAtToGameEvents';
import { CreateCandidatesAndTryouts1779000000000 } from './1779000000000-CreateCandidatesAndTryouts';
import { CreateScoutingAndEvaluations1779100000000 } from './1779100000000-CreateScoutingAndEvaluations';
import { CreateSeasonPlayers1779200000000 } from './1779200000000-CreateSeasonPlayers';
import { CreateLeaguesAndLinkEvents1779300000000 } from './1779300000000-CreateLeaguesAndLinkEvents';
import { AddCalendarSecretToTeams1780609000000 } from './1780609000000-AddCalendarSecretToTeams';
import { SupportCustomPracticeDrills1780700000000 } from './1780700000000-SupportCustomPracticeDrills';
import { AllowAdditionalPropertiesInSoccerEventDefinitions1780800000000 } from './1780800000000-AllowAdditionalPropertiesInSoccerEventDefinitions';
import { AddGoalkeeperEventDefinitions1780900000000 } from './1780900000000-AddGoalkeeperEventDefinitions';
import { AddClockSyncColumns1782356834095 } from './1782356834095-AddClockSyncColumns';
import { AddShotsAndCornerKicks1782357000000 } from './1782357000000-AddShotsAndCornerKicks';
import { CreateEventNotes1782532847433 } from './1782532847433-CreateEventNotes';
import { AddOwnGoalEventDefinition1782600000000 } from './1782600000000-AddOwnGoalEventDefinition';
import { MoveHomeLocationToSeasons1782700000000 } from './1782700000000-MoveHomeLocationToSeasons';
import { MoveDefaultsToCompetitions1782800000000 } from './1782800000000-MoveDefaultsToCompetitions';
import { SeedVolleyballSport1782900000000 } from './1782900000000-SeedVolleyballSport';
import { SeedVolleyballEventDefinitions1783000000000 } from './1783000000000-SeedVolleyballEventDefinitions';
import { AddScoreWinningRulesToSeason1783100000000 } from './1783100000000-AddScoreWinningRulesToSeason';
import { MoveScoreWinningRulesToLeagues1783200000000 } from './1783200000000-MoveScoreWinningRulesToLeagues';
import { AddDecidingSetScoreRules1783300000000 } from './1783300000000-AddDecidingSetScoreRules';
import { AddServeReceiveEventDefinition1783400000000 } from './1783400000000-AddServeReceiveEventDefinition';
import { AddHitEventDefinition1783500000000 } from './1783500000000-AddHitEventDefinition';
import { AddSetEventDefinitions1783600000000 } from './1783600000000-AddSetEventDefinitions';
import { AddBlockTouchDefinition1783700000000 } from './1783700000000-AddBlockTouchDefinition';
import { AddServeAttemptDefinition1783800000000 } from './1783800000000-AddServeAttemptDefinition';
import { UpdateServeReceiveMinimumScore1783900000000 } from './1783900000000-UpdateServeReceiveMinimumScore';
import { ImproveTryoutConsole1784000000000 } from './1784000000000-ImproveTryoutConsole';
import { CreateSeasonChecklist1784100000000 } from './1784100000000-CreateSeasonChecklist';
import { AddIgnorePlayingTimeAndGuestPlayers1784200000000 } from './1784200000000-AddIgnorePlayingTimeAndGuestPlayers';
import { AddLeagueToGuestPlayers1784300000000 } from './1784300000000-AddLeagueToGuestPlayers';
import { AddIsActiveToPlayers1784400000000 } from './1784400000000-AddIsActiveToPlayers';
import { UpdatePositionSwapPayloadSchema1784500000000 } from './1784500000000-UpdatePositionSwapPayloadSchema';
import { CreateOpponents1784600000000 } from './1784600000000-CreateOpponents';
import { CreatePlayerAwards1784700000000 } from './1784700000000-CreatePlayerAwards';
import { CreatePlayerGoalsAndNotes1784800000000 } from './1784800000000-CreatePlayerGoalsAndNotes';
import { CreateTacticPlays1784900000000 } from './1784900000000-CreateTacticPlays';

export const ALL_MIGRATIONS = [
  InitialSchema1744934400000,
  AddAuthColumns1744990000000,
  MoveFormatFieldsToSeasons1745020800000,
  AddParentEmailToPlayer1776466961975,
  GamesLineupPhase1776489800000,
  AddEventDefinitionsToSport1776510000000,
  AddOpponentGoalEvent1776580000000,
  SeasonDefaultsAndSlots1776664695002,
  AddPracticeLocationToSeason1776696865998,
  EventsRefactor1776700000000,
  AddScoreToEvents1776800000000,
  AdvancedGameManagement1776850000000,
  DrillLibraryFoundation1776910000000,
  CreatePracticeDrills1776925799677,
  AddPlayersOnFieldToEvents1777100000000,
  TeamMemberships1777200000000,
  AddSchedulingAndWeather1777704365283,
  AddTeamIdToLocations1777780603397,
  UpdateSoccerEventDefinitions1778000000000,
  CreateAttendance1778100000000,
  AddCreatedAtToGameEvents1778200000000,
  CreateCandidatesAndTryouts1779000000000,
  CreateScoutingAndEvaluations1779100000000,
  CreateSeasonPlayers1779200000000,
  CreateLeaguesAndLinkEvents1779300000000,
  AddCalendarSecretToTeams1780609000000,
  SupportCustomPracticeDrills1780700000000,
  AllowAdditionalPropertiesInSoccerEventDefinitions1780800000000,
  AddGoalkeeperEventDefinitions1780900000000,
  AddClockSyncColumns1782356834095,
  AddShotsAndCornerKicks1782357000000,
  CreateEventNotes1782532847433,
  AddOwnGoalEventDefinition1782600000000,
  MoveHomeLocationToSeasons1782700000000,
  MoveDefaultsToCompetitions1782800000000,
  SeedVolleyballSport1782900000000,
  SeedVolleyballEventDefinitions1783000000000,
  AddScoreWinningRulesToSeason1783100000000,
  MoveScoreWinningRulesToLeagues1783200000000,
  AddDecidingSetScoreRules1783300000000,
  AddServeReceiveEventDefinition1783400000000,
  AddHitEventDefinition1783500000000,
  AddSetEventDefinitions1783600000000,
  AddBlockTouchDefinition1783700000000,
  AddServeAttemptDefinition1783800000000,
  UpdateServeReceiveMinimumScore1783900000000,
  ImproveTryoutConsole1784000000000,
  CreateSeasonChecklist1784100000000,
  AddIgnorePlayingTimeAndGuestPlayers1784200000000,
  AddLeagueToGuestPlayers1784300000000,
  AddIsActiveToPlayers1784400000000,
  UpdatePositionSwapPayloadSchema1784500000000,
  CreateOpponents1784600000000,
  CreatePlayerAwards1784700000000,
  CreatePlayerGoalsAndNotes1784800000000,
  CreateTacticPlays1784900000000,
];


