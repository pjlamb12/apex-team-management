# Quick Task Plan: Add Win/Loss/Draw Team Record to Analytics Page

## Problem
The team analytics page does not show the team's win/loss/draw record. Coaches need to view the overall record for the selected season when "All Competitions" is chosen, or the filtered record when a specific competition (league) filter is selected.

## Solution
1. Backend (`SeasonsService` & `SeasonsController`):
   - Update `SeasonsService.getSeasonStats` to accept an optional `leagueId` filter parameter.
   - Update `SeasonsController.getStats` to accept `@Query('leagueId')`.
   - Update `seasons.service.spec.ts` unit tests.

2. Frontend (`SeasonsService` & `TeamAnalytics`):
   - Update frontend `SeasonsService.getSeasonStats` to pass `leagueId` query parameter when present.
   - Update `TeamAnalytics` component to fetch `teamStats` in `loadData()` using `SeasonsService.getSeasonStats`.
   - Add `getRecordScopeLabel()` helper method to display context-aware scope header.
   - Add a high-contrast Athletic Professional "Team Record" summary card at the top of the analytics page.

## Plan
- Edit `apps/api/src/teams/seasons.service.ts` & `apps/api/src/teams/seasons.controller.ts`.
- Edit `libs/client/data-access/team/src/lib/seasons.service.ts`.
- Edit `apps/frontend/src/app/teams/team-dashboard/analytics/analytics.ts` & `analytics.html`.
- Add unit tests for API and Frontend.
- Run `npx nx test api` and `npx nx test frontend` to verify.
