import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];
