import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { animate } from 'animejs/animation';
import { GameMode } from '../../core/models/game.model';
import { DataDragonService } from '../../core/services/data-dragon.service';
import { GameService } from '../../core/services/game.service';
import { I18nService } from '../../core/services/i18n.service';
import { ChampionCombobox, ComboOption } from '../../shared/components/champion-combobox/champion-combobox';
import { ModeBadges } from '../../shared/components/mode-badges/mode-badges';
import { ModeIcon } from '../../shared/components/mode-icon/mode-icon';
import { EnterAnimateDirective } from '../../shared/directives/enter-animate.directive';

@Component({
  selector: 'app-game-page',
  imports: [ChampionCombobox, ModeBadges, ModeIcon, EnterAnimateDirective],
  templateUrl: './game.page.html',
})
export class GamePage {
  private readonly game = inject(GameService);
  private readonly dataDragon = inject(DataDragonService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  readonly GameMode = GameMode;
  readonly status = this.game.status;
  readonly loading = this.game.loading;
  readonly target = this.game.target;
  readonly activeModes = this.game.activeModes;
  readonly attempts = this.game.attempts;
  readonly zoom = this.game.zoom;
  readonly focalPoint = this.game.focalPoint;
  readonly elapsedMs = this.game.elapsedMs;
  readonly vultoHidden = this.game.vultoHidden;
  readonly vultoCountdown = this.game.vultoCountdown;
  readonly isVultoActive = this.game.isVultoActive;
  readonly isPretoEBrancoActive = this.game.isPretoEBrancoActive;

  readonly championOptions = signal<ComboOption[]>([]);
  readonly skinOptions = signal<ComboOption[]>([]);
  readonly selectedChampion = signal<ComboOption | null>(null);
  readonly selectedSkin = signal<ComboOption | null>(null);
  readonly skinsLoading = signal(false);

  readonly canSubmit = computed(
    () => !!this.selectedChampion() && !!this.selectedSkin() && this.status() === 'playing',
  );

  private readonly imageBox = viewChild<ElementRef<HTMLElement>>('imageBox');
  private readonly splashImg = viewChild<ElementRef<HTMLElement>>('splashImg');

  private currentRoundKey?: string;
  private lastAnimatedZoom?: number;

  constructor() {
    if (!this.game.loading() && !this.game.target() && this.game.status() === 'idle') {
      this.router.navigateByUrl('/');
    }

    this.dataDragon.getChampions().subscribe((champions) => {
      this.championOptions.set(champions.map((champion) => ({ id: champion.id, label: champion.name })));
    });

    effect(() => {
      const champion = this.selectedChampion();
      this.selectedSkin.set(null);
      this.skinOptions.set([]);
      if (!champion) {
        return;
      }
      this.skinsLoading.set(true);
      this.dataDragon.getChampionDetail(champion.id).subscribe((detail) => {
        const excluded = this.game.excludedSkins();
        const skins = this.dataDragon
          .realSkins(detail)
          .filter((skin) => !excluded.has(`${champion.id}_${skin.num}`))
          .slice()
          .sort((a, b) => a.num - b.num);
        this.skinOptions.set(
          skins.map((skin) => ({ id: String(skin.num), label: this.dataDragon.skinLabel(skin) })),
        );
        this.skinsLoading.set(false);
      });
    });

    // Applies the round's zoom to the splash element as soon as it exists in
    // the DOM (it's behind an @if gated by loading/vulto state, so it may not
    // be there yet on the first tick), instantly for a new round and animated
    // for subsequent zoom-outs after a wrong attempt. Zoom is driven via
    // background-size rather than a CSS transform: scaling an already-fitted
    // <img> with transform stretches its rasterized bitmap and looks blurry,
    // while background-size re-samples from the source image at each size.
    effect(() => {
      const el = this.splashImg()?.nativeElement;
      const currentTarget = this.target();
      const currentZoom = this.zoom();
      if (!el || !currentTarget) {
        return;
      }

      const roundKey = `${currentTarget.championId}_${currentTarget.skinNum}`;
      if (roundKey !== this.currentRoundKey) {
        this.currentRoundKey = roundKey;
        this.lastAnimatedZoom = currentZoom;
        el.style.backgroundSize = `${currentZoom * 100}%`;
        return;
      }

      if (currentZoom === this.lastAnimatedZoom) {
        return;
      }
      this.lastAnimatedZoom = currentZoom;
      animate(el, { backgroundSize: `${currentZoom * 100}%`, duration: 600, ease: 'outQuad' });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }
    if (this.canSubmit()) {
      this.submit();
    }
  }

  submit(): void {
    const champion = this.selectedChampion();
    const skin = this.selectedSkin();
    if (!champion || !skin || this.status() !== 'playing') {
      return;
    }

    this.game.submitAttempt(champion.id, champion.label, Number(skin.id), skin.label);

    if (this.game.status() === 'playing') {
      this.shakeImage();
    }
    this.selectedChampion.set(null);
  }

  formattedTime(): string {
    const totalSeconds = Math.floor(this.elapsedMs() / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private shakeImage(): void {
    const box = this.imageBox()?.nativeElement;
    if (!box) {
      return;
    }
    animate(box, {
      translateX: [0, -10, 10, -6, 6, 0],
      duration: 420,
      ease: 'inOutQuad',
    });
  }
}
