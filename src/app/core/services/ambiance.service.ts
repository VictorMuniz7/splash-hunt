import { Injectable, signal } from '@angular/core';

/**
 * Tiny shared UI-mood flag so decorative, non-routed pieces of the page
 * (the global wave background) can react to interactions that happen deep
 * inside a routed page (hovering the menu's start button) without a direct
 * parent/child relationship between them.
 */
@Injectable({ providedIn: 'root' })
export class AmbianceService {
  readonly heroHover = signal(false);
}
