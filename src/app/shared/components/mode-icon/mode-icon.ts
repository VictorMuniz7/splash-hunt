import { Component, input } from '@angular/core';
import { GameMode } from '../../../core/models/game.model';

@Component({
  selector: 'app-mode-icon',
  templateUrl: './mode-icon.html',
})
export class ModeIcon {
  readonly mode = input.required<GameMode>();
  readonly GameMode = GameMode;
}
