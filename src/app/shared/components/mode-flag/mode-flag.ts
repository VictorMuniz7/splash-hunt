import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

export type ModeFlagKind = 'multiplayer' | 'solo';

@Component({
  selector: 'app-mode-flag',
  templateUrl: './mode-flag.html',
})
export class ModeFlag {
  protected readonly i18n = inject(I18nService);

  readonly kind = input.required<ModeFlagKind>();
  readonly activate = output<void>();

  fillClass(): string {
    return this.kind() === 'multiplayer' ? 'bg-[#2c4a23]' : 'bg-[#3a1856]';
  }

  label(): string {
    return this.kind() === 'multiplayer' ? this.i18n.t('flag.multiplayer') : this.i18n.t('flag.solo');
  }
}
