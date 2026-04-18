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
        path: 'teams/:id',
        loadComponent: () =>
          import('./teams/team-dashboard/team-dashboard').then((m) => m.TeamDashboard),
      },
      {
        path: 'teams/:id/settings',
        loadComponent: () =>
          import('./teams/edit-team/edit-team').then((m) => m.EditTeam),
      },
      {
        path: 'teams/:id/games/new',
        loadComponent: () =>
          import('./teams/games/create-game/create-game').then((m) => m.CreateGame),
      },
      {
        path: 'teams/:id/games/:gameId/edit',
        loadComponent: () =>
          import('./teams/games/edit-game/edit-game').then((m) => m.EditGame),
      },
      {
        path: 'teams/:id/games/:gameId/lineup',
        loadComponent: () =>
          import('./teams/games/lineup-editor/lineup-editor').then((m) => m.LineupEditor),
      },
      { path: '', redirectTo: 'teams', pathMatch: 'full' },
    ],
  },
  // Legacy redirect: /home → /teams (per D-01 — home can redirect to teams)
  { path: 'home', redirectTo: '/teams', pathMatch: 'full' },
  // Catch-all: unauthenticated default goes to login
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
