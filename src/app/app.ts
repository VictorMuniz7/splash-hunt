import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { AppFooter } from './shared/components/app-footer/app-footer';
import { AppHeader } from './shared/components/app-header/app-header';
import { GrassBackground } from './shared/components/grass-background/grass-background';
import { WaveBackground } from './shared/components/wave-background/wave-background';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WaveBackground, GrassBackground, AppHeader, AppFooter],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  constructor() {
    // The multiplayer guard turns the theme on when entering /multiplayer/**;
    // nothing turns it back off on the way out (browser back button, a link
    // that isn't the Solo flag, etc.) without this.
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      if (!event.urlAfterRedirects.startsWith('/multiplayer')) {
        this.theme.mode.set('solo');
      }
    });
  }
}
