import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  // Unauthenticated routes (outside the shell — per D-15)
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  // Authenticated shell — wraps all post-login routes (per D-13, D-15)
  {
    path: '',
    loadComponent: () => import('./shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: 'teams',
        loadComponent: () =>
          import('./teams/teams-list/teams-list').then((m) => m.TeamsList),
      },
      {
        path: 'teams/new',
        loadComponent: () =>
          import('./teams/create-team/create-team').then((m) => m.CreateTeam),
      },
      {
        path: 'teams/:id/settings',
        loadComponent: () =>
          import('./teams/edit-team/edit-team').then((m) => m.EditTeam),
      },
      {
        path: 'teams/:id/settings/seasons',
        loadComponent: () =>
          import('./teams/seasons/seasons-list/seasons-list').then((m) => m.SeasonsList),
      },
      {
        path: 'teams/:id/settings/seasons/:seasonId',
        loadComponent: () =>
          import('./teams/seasons/season-detail/season-detail').then((m) => m.SeasonDetail),
      },
      {
        path: 'teams/:id/events/new',
        loadComponent: () =>
          import('./teams/events/create-event/create-event').then((m) => m.CreateEvent),
      },
      {
        path: 'teams/:id/events/new-practice',
        loadComponent: () =>
          import('./teams/events/create-practice/create-practice').then((m) => m.CreatePractice),
      },
      {
        path: 'teams/:id/events/:eventId/edit',
        loadComponent: () =>
          import('./teams/events/edit-event/edit-event').then((m) => m.EditEvent),
      },
      {
        path: 'teams/:id/events/:eventId/lineup',
        loadComponent: () =>
          import('./teams/events/lineup-editor/lineup-editor').then((m) => m.LineupEditor),
      },
      {
        path: 'teams/:id/events/:eventId/console',
        loadComponent: () =>
          import('@apex-team/client/feature/game-console').then((m) => m.ConsoleWrapper),
      },
      {
        path: 'teams/:id',
        loadComponent: () =>
          import('./teams/team-dashboard/team-dashboard').then((m) => m.TeamDashboard),
      },
      { path: '', redirectTo: 'teams', pathMatch: 'full' },
    ],
  },
  // Legacy redirect: /home → /teams (per D-01 — home can redirect to teams)
  { path: 'home', redirectTo: '/teams', pathMatch: 'full' },
  // Catch-all: unauthenticated default goes to login
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
