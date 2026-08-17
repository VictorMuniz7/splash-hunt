import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { animate } from 'animejs/animation';
import { AmbianceService } from '../../core/services/ambiance.service';
import { GameMode } from '../../core/models/game.model';
import { GameService } from '../../core/services/game.service';
import { I18nService } from '../../core/services/i18n.service';
import { ModeIcon } from '../../shared/components/mode-icon/mode-icon';

@Component({
  selector: 'app-menu-page',
  imports: [ModeIcon],
  templateUrl: './menu.page.html',
})
export class MenuPage implements AfterViewInit, OnDestroy {
  private readonly game = inject(GameService);
  private readonly ambiance = inject(AmbianceService);
  protected readonly i18n = inject(I18nService);

  readonly GameMode = GameMode;
  readonly vultoActive = signal(false);
  readonly pbActive = signal(false);

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

  toggleVulto(): void {
    this.vultoActive.update((value) => !value);
  }

  togglePretoEBranco(): void {
    this.pbActive.update((value) => !value);
  }

  ringClass(active: boolean): string {
    const base =
      'mode-icon-ring flex h-12 w-12 items-center justify-center rounded-full border-2 p-2.5 transition-colors sm:h-14 sm:w-14';
    return active
      ? `${base} border-splash-magenta/70 bg-splash-magenta/10 text-splash-gold shadow-[0_0_18px_rgba(178,58,237,0.4)]`
      : `${base} border-splash-gold/25 text-[#cbb9d6]/70`;
  }

  onOptionEnter(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const tooltip = target.querySelector<HTMLElement>('.mode-tooltip');
    const ring = target.querySelector<HTMLElement>('.mode-icon-ring');
    if (tooltip) {
      animate(tooltip, { opacity: [0, 1], translateY: [8, 0], duration: 260, ease: 'outQuad' });
    }
    if (ring) {
      animate(ring, { scale: [1, 1.08], duration: 260, ease: 'outQuad' });
    }
  }

  onOptionLeave(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const tooltip = target.querySelector<HTMLElement>('.mode-tooltip');
    const ring = target.querySelector<HTMLElement>('.mode-icon-ring');
    if (tooltip) {
      animate(tooltip, { opacity: [1, 0], translateY: [0, 8], duration: 200, ease: 'inQuad' });
    }
    if (ring) {
      animate(ring, { scale: [1.08, 1], duration: 200, ease: 'inQuad' });
    }
  }

  onStartHover(event: MouseEvent): void {
    this.ambiance.heroHover.set(true);

    const target = event.currentTarget as HTMLElement;
    const glow = target.querySelector<HTMLElement>('.start-glow');
    if (glow) {
      animate(glow, { opacity: [0, 1], duration: 450, ease: 'outQuad' });
    }
  }

  onStartLeave(event: MouseEvent): void {
    this.ambiance.heroHover.set(false);

    const target = event.currentTarget as HTMLElement;
    const glow = target.querySelector<HTMLElement>('.start-glow');
    if (glow) {
      animate(glow, { opacity: [1, 0], duration: 300, ease: 'inQuad' });
    }
  }

  onStart(): void {
    const modes: GameMode[] = [];
    if (this.vultoActive()) {
      modes.push(GameMode.Vulto);
    }
    if (this.pbActive()) {
      modes.push(GameMode.PretoEBranco);
    }
    this.game.startNewGame(modes);
  }

  ngOnDestroy(): void {
    // Clicking the button navigates away without ever firing mouseleave —
    // make sure the wave background doesn't stay stuck in its hover state.
    this.ambiance.heroHover.set(false);
  }
}
