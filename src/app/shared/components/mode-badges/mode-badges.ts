import { Component, inject, input } from '@angular/core';
import { GameMode } from '../../../core/models/game.model';
import { I18nService } from '../../../core/services/i18n.service';
import { ModeIcon } from '../mode-icon/mode-icon';

@Component({
  selector: 'app-mode-badges',
  imports: [ModeIcon],
  templateUrl: './mode-badges.html',
})
export class ModeBadges {
  private readonly i18n = inject(I18nService);

  readonly modes = input<GameMode[]>([]);

  label(mode: GameMode): string {
    return mode === GameMode.Vulto ? this.i18n.t('mode.vulto') : this.i18n.t('mode.pretoEBranco');
  }
}
