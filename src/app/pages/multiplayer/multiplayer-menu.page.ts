import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { animate } from 'animejs/animation';
import { I18nService } from '../../core/services/i18n.service';
import { authErrorKey, SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-multiplayer-menu-page',
  templateUrl: './multiplayer-menu.page.html',
})
export class MultiplayerMenuPage implements AfterViewInit {
  protected readonly i18n = inject(I18nService);
  protected readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly enteringNickname = signal(false);
  readonly nickname = signal('');
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

  goToAuth(): void {
    this.router.navigateByUrl('/multiplayer/entrar');
  }

  goToRooms(): void {
    this.router.navigateByUrl('/multiplayer/salas');
  }

  startAnonymous(): void {
    this.enteringNickname.set(true);
  }

  async confirmAnonymous(): Promise<void> {
    const value = this.nickname().trim();
    if (!value) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { error } = await this.supabase.signInAnonymously(value);
    this.submitting.set(false);
    if (error) {
      this.error.set(this.i18n.t(authErrorKey(error)));
      return;
    }
    this.goToRooms();
  }
}
