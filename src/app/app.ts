import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFooter } from './shared/components/app-footer/app-footer';
import { AppHeader } from './shared/components/app-header/app-header';
import { WaveBackground } from './shared/components/wave-background/wave-background';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WaveBackground, AppHeader, AppFooter],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
