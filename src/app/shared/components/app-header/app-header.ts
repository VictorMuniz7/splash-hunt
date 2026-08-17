import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.html',
})
export class AppHeader {
  protected readonly i18n = inject(I18nService);
}
