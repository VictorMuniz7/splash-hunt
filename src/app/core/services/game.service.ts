import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  INITIAL_ZOOM,
  MIN_ZOOM,
  VULTO_COUNTDOWN_S,
  VULTO_REVEAL_MS,
  ZOOM_STEP,
} from '../config/game.config';
import { SplashOption } from '../models/champion.model';
import { Attempt, GameMode, GameResult, GameStatus } from '../models/game.model';
import { DataDragonService } from './data-dragon.service';

export interface FocalPoint {
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly dataDragon = inject(DataDragonService);
  private readonly router = inject(Router);

  readonly status = signal<GameStatus>('idle');
  readonly loading = signal(false);
  readonly target = signal<SplashOption | null>(null);
  readonly activeModes = signal<GameMode[]>([]);
  readonly attempts = signal<Attempt[]>([]);
  readonly zoom = signal(INITIAL_ZOOM);
  readonly focalPoint = signal<FocalPoint>({ x: 50, y: 50 });
  readonly elapsedMs = signal(0);
  readonly vultoHidden = signal(false);
  readonly vultoCountdown = signal(VULTO_COUNTDOWN_S);
  readonly lastResult = signal<GameResult | null>(null);
  /** championId_skinNum keys already guessed wrong this round — excluded from the skin selector. */
  readonly excludedSkins = signal<Set<string>>(new Set());

  readonly isVultoActive = computed(() => this.activeModes().includes(GameMode.Vulto));
  readonly isPretoEBrancoActive = computed(() => this.activeModes().includes(GameMode.PretoEBranco));

  private timerHandle?: ReturnType<typeof setInterval>;
  private vultoRevealHandle?: ReturnType<typeof setTimeout>;
  private vultoCountdownHandle?: ReturnType<typeof setInterval>;
  private startedAt = 0;

  startNewGame(modes: GameMode[]): void {
    this.clearTimers();
    this.status.set('idle');
    this.loading.set(true);
    this.activeModes.set(modes);
    this.attempts.set([]);
    this.zoom.set(INITIAL_ZOOM);
    this.focalPoint.set({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
    this.elapsedMs.set(0);
    this.vultoHidden.set(false);
    this.vultoCountdown.set(VULTO_COUNTDOWN_S);
    this.lastResult.set(null);
    this.excludedSkins.set(new Set());
    this.target.set(null);

    this.router.navigateByUrl('/jogar');

    this.dataDragon.getRandomSplashOption().subscribe((option) => {
      this.target.set(option);
      this.loading.set(false);
      this.status.set('playing');
      this.startTimer();
      if (this.isVultoActive()) {
        this.scheduleVultoReveal();
      }
    });
  }

  submitAttempt(championId: string, championName: string, skinNum: number, skinLabel: string): void {
    const target = this.target();
    if (!target || this.status() !== 'playing') {
      return;
    }

    const correct = target.championId === championId && target.skinNum === skinNum;
    this.attempts.update((list) => [...list, { championName, skinLabel, correct }]);

    if (correct) {
      this.finishGame('won');
      return;
    }

    this.excludedSkins.update((set) => {
      const next = new Set(set);
      next.add(`${championId}_${skinNum}`);
      return next;
    });

    if (this.isVultoActive()) {
      this.finishGame('lost');
      return;
    }

    this.zoom.update((current) => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
  }

  resetToMenu(): void {
    this.clearTimers();
    this.status.set('idle');
    this.target.set(null);
    this.lastResult.set(null);
    this.router.navigateByUrl('/');
  }

  private startTimer(): void {
    this.startedAt = Date.now();
    this.timerHandle = setInterval(() => {
      this.elapsedMs.set(Date.now() - this.startedAt);
    }, 100);
  }

  private scheduleVultoReveal(): void {
    this.vultoRevealHandle = setTimeout(() => {
      this.vultoHidden.set(true);
      this.startVultoCountdown();
    }, VULTO_REVEAL_MS);
  }

  private startVultoCountdown(): void {
    let remaining = VULTO_COUNTDOWN_S;
    this.vultoCountdown.set(remaining);
    this.vultoCountdownHandle = setInterval(() => {
      remaining -= 1;
      this.vultoCountdown.set(remaining);
      if (remaining <= 0) {
        this.finishGame('lost');
      }
    }, 1000);
  }

  private finishGame(outcome: 'won' | 'lost'): void {
    this.clearTimers();
    this.status.set(outcome);
    const target = this.target();
    if (!target) {
      return;
    }
    this.lastResult.set({
      status: outcome,
      attempts: this.attempts(),
      elapsedMs: this.elapsedMs(),
      activeModes: this.activeModes(),
      target,
    });
    this.router.navigateByUrl('/resultado');
  }

  private clearTimers(): void {
    if (this.timerHandle !== undefined) {
      clearInterval(this.timerHandle);
    }
    if (this.vultoRevealHandle !== undefined) {
      clearTimeout(this.vultoRevealHandle);
    }
    if (this.vultoCountdownHandle !== undefined) {
      clearInterval(this.vultoCountdownHandle);
    }
  }
}
