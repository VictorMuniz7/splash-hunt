import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { animate } from 'animejs/animation';
import { I18nService } from '../../core/services/i18n.service';
import { authErrorKey, lastNickname, SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-multiplayer-menu-page',
  templateUrl: './multiplayer-menu.page.html',
})
export class MultiplayerMenuPage implements AfterViewInit {
  protected readonly i18n = inject(I18nService);
  protected readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly nickname = signal('');
  /** Previous nickname (this session's, or the last one used on this
   * browser): shown as placeholder and used if the field is left empty. */
  readonly previousNickname = this.supabase.sessionNickname() ?? lastNickname();
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  private readonly sceneRoot = viewChild<ElementRef<HTMLElement>>('sceneRoot');

  ngAfterViewInit(): void {
    const scene = this.sceneRoot()?.nativeElement;
    if (scene) {
      animate(scene, {
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 700,
        ease: 'outQuad',
      });
    }
  }

  goToRooms(): void {
    this.router.navigateByUrl('/multiplayer/salas');
  }

  async confirmNickname(): Promise<void> {
    const value = this.nickname().trim() || this.previousNickname?.trim();
    if (!value || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    try {
      const { error } = await this.supabase.enterWithNickname(value);
      if (error) {
        this.error.set(this.i18n.t(authErrorKey(error)));
        return;
      }
      this.goToRooms();
    } catch {
      // Network failure (server unreachable): fetch throws instead of
      // returning an error object.
      this.error.set(this.i18n.t('auth.genericError'));
    } finally {
      this.submitting.set(false);
    }
  }
}
