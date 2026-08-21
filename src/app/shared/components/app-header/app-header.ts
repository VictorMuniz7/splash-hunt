import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ModeFlag } from '../mode-flag/mode-flag';
import { ProfileBadge } from '../profile-badge/profile-badge';

const IN_ROOM_PATTERN = /^\/multiplayer\/salas\/.+/;

@Component({
  selector: 'app-header',
  imports: [ProfileBadge, ModeFlag],
  templateUrl: './app-header.html',
})
export class AppHeader {
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  /** Hides the Solo/Multiplayer switch flag while inside a room lobby or
   * match — jumping straight to Solo from there would skip the proper
   * leave/cancel flow and strand room state (guest_id left set, etc.). */
  protected readonly inRoom = signal(IN_ROOM_PATTERN.test(this.router.url));

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.inRoom.set(IN_ROOM_PATTERN.test(event.urlAfterRedirects));
    });
  }

  toggleMode(): void {
    this.router.navigateByUrl(this.theme.mode() === 'solo' ? '/multiplayer' : '/');
  }
}
