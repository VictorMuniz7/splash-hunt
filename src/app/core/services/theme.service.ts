import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'solo' | 'multiplayer';

/**
 * Setting the theme attribute on <html> (not a template-level wrapper)
 * matters: `body` declares its own `background-color: var(--color-splash-bg)`,
 * and a CSS custom-property override only cascades to descendants of the
 * element it's set on — <body> itself needs the override to live at or above it.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>('solo');

  constructor() {
    effect(() => {
      const current = this.mode();
      if (current === 'multiplayer') {
        this.document.documentElement.setAttribute('data-theme', 'multiplayer');
      } else {
        this.document.documentElement.removeAttribute('data-theme');
      }
    });
  }
}
