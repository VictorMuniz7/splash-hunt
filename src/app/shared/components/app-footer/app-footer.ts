import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.html',
})
export class AppFooter {
  protected readonly i18n = inject(I18nService);
}
