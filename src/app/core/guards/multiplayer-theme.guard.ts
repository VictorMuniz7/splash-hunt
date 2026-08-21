import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { ThemeService } from '../services/theme.service';

/** Switches the app into the multiplayer (green) theme while on any /multiplayer/** route. */
export const multiplayerThemeGuard: CanActivateFn = () => {
  inject(ThemeService).mode.set('multiplayer');
  return true;
};
