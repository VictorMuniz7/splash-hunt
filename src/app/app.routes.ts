import { Routes } from '@angular/router';
import { multiplayerThemeGuard } from './core/guards/multiplayer-theme.guard';
import { requireSessionGuard } from './core/guards/require-session.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/menu/menu.page').then((m) => m.MenuPage),
  },
  {
    path: 'jogar',
    loadComponent: () => import('./pages/game/game.page').then((m) => m.GamePage),
  },
  {
    path: 'resultado',
    loadComponent: () => import('./pages/result/result.page').then((m) => m.ResultPage),
  },
  {
    path: 'multiplayer',
    canActivate: [multiplayerThemeGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/multiplayer/multiplayer-menu.page').then((m) => m.MultiplayerMenuPage),
      },
      {
        path: 'entrar',
        loadComponent: () =>
          import('./pages/multiplayer/auth/login-register.page').then((m) => m.LoginRegisterPage),
      },
      {
        path: 'salas',
        canActivate: [requireSessionGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/multiplayer/rooms/rooms-hub.page').then((m) => m.RoomsHubPage),
          },
          {
            path: ':roomId',
            loadComponent: () =>
              import('./pages/multiplayer/rooms/room-lobby.page').then((m) => m.RoomLobbyPage),
          },
          {
            path: ':roomId/partida',
            loadComponent: () => import('./pages/multiplayer/rooms/match.page').then((m) => m.MatchPage),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
