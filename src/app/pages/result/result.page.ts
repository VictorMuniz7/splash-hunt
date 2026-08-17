import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { animate } from 'animejs/animation';
import { GameService } from '../../core/services/game.service';
import { I18nService } from '../../core/services/i18n.service';
import { ModeBadges } from '../../shared/components/mode-badges/mode-badges';

@Component({
  selector: 'app-result-page',
  imports: [ModeBadges],
  templateUrl: './result.page.html',
})
export class ResultPage implements AfterViewInit {
  private readonly game = inject(GameService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  readonly result = this.game.lastResult;
  readonly isWin = computed(() => this.result()?.status === 'won');

  @ViewChild('revealBox') private readonly revealBoxRef?: ElementRef<HTMLElement>;
  @ViewChild('resultCard') private readonly resultCardRef?: ElementRef<HTMLElement>;

  constructor() {
    if (!this.result()) {
      this.router.navigateByUrl('/');
    }
  }

  ngAfterViewInit(): void {
    const box = this.revealBoxRef?.nativeElement;
    const card = this.resultCardRef?.nativeElement;

    if (box) {
      animate(box, {
        opacity: [0, 1],
        scale: [0.85, 1],
        duration: 700,
        ease: 'outExpo',
      });
      const flash = box.querySelector<HTMLElement>('.reveal-flash');
      if (flash) {
        animate(flash, { opacity: [0.9, 0], duration: 900, ease: 'outQuad' });
      }
    }

    if (card) {
      animate(card, {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 600,
        delay: 250,
        ease: 'outQuad',
      });
    }
  }

  formattedTime(): string {
    const ms = this.result()?.elapsedMs ?? 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  playAgain(): void {
    this.game.resetToMenu();
  }
}
