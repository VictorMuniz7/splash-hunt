import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RESULTS_CARD_INTERVAL_MS, RESULTS_WINNER_PAUSE_MS } from '../../../../core/config/game.config';
import { MatchRound, MatchWithProfiles, RoundAttempt, isVultoRuleset } from '../../../../core/models/match.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { EnterAnimateDirective } from '../../../../shared/directives/enter-animate.directive';
import { WinnerRevealDirective } from '../../../../shared/directives/winner-reveal.directive';

export type RoundOutcome = 'correct' | 'gaveUp' | 'timeout' | 'none';

@Component({
  selector: 'app-match-results',
  imports: [EnterAnimateDirective, WinnerRevealDirective],
  templateUrl: './match-results.html',
})
export class MatchResults implements OnInit, OnDestroy {
  protected readonly i18n = inject(I18nService);

  readonly match = input.required<MatchWithProfiles>();
  readonly rounds = input.required<MatchRound[]>();
  readonly attempts = input.required<RoundAttempt[]>();
  readonly isHost = input.required<boolean>();

  readonly playAgain = output<void>();
  /** Guest-only: just navigate back to the lobby, without leaving the room. */
  readonly backToRoom = output<void>();
  readonly leave = output<void>();

  readonly visibleCount = signal(0);
  readonly showWinner = signal(false);

  private cardInterval?: ReturnType<typeof setInterval>;
  private winnerTimeout?: ReturnType<typeof setTimeout>;

  /** Padrão/Preto e Branco show every round; Vulto/Anomaly only the ones someone actually scored. */
  readonly cascadeRounds = computed<MatchRound[]>(() => {
    const all = [...this.rounds()].sort((a, b) => a.roundNumber - b.roundNumber);
    if (!isVultoRuleset(this.match().mode)) {
      return all;
    }
    return all.filter((r) => r.hostPoints > 0 || r.guestPoints > 0);
  });

  readonly visibleRounds = computed(() => this.cascadeRounds().slice(0, this.visibleCount()));

  private readonly cardEls = viewChildren<ElementRef<HTMLElement>>('roundCard');
  private readonly winnerSectionEl = viewChild<ElementRef<HTMLElement>>('winnerSection');

  constructor() {
    // Scroll each newly-mounted card into view as the cascade reveals it.
    // Deferred a frame so the card has actually been laid out first (it's
    // still animating in via appEnterAnimate, which is fine to scroll past).
    effect(() => {
      const cards = this.cardEls();
      const last = cards[cards.length - 1];
      if (!last) {
        return;
      }
      requestAnimationFrame(() => last.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    });

    // Then scroll down to the winner reveal once it mounts.
    effect(() => {
      if (!this.showWinner()) {
        return;
      }
      requestAnimationFrame(() => this.winnerSectionEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    });
  }

  ngOnInit(): void {
    const total = this.cascadeRounds().length;
    if (total === 0) {
      this.revealWinnerAfterPause();
      return;
    }
    this.cardInterval = setInterval(() => {
      const next = this.visibleCount() + 1;
      this.visibleCount.set(next);
      if (next >= total) {
        this.stopCardInterval();
        this.revealWinnerAfterPause();
      }
    }, RESULTS_CARD_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    this.stopCardInterval();
    if (this.winnerTimeout) {
      clearTimeout(this.winnerTimeout);
    }
  }

  private stopCardInterval(): void {
    if (this.cardInterval) {
      clearInterval(this.cardInterval);
      this.cardInterval = undefined;
    }
  }

  private revealWinnerAfterPause(): void {
    this.winnerTimeout = setTimeout(() => this.showWinner.set(true), RESULTS_WINNER_PAUSE_MS);
  }

  /**
   * A player can submit several wrong attempts before a round resolves, and
   * a round that ends by timeout never gets a round_attempts row at all for
   * whoever ran out of time — so this can't be a plain filter, it has to
   * pick the one outcome that actually describes what happened.
   */
  outcomeFor(round: MatchRound, profileId: string): RoundOutcome {
    const mine = this.attempts().filter((a) => a.roundId === round.id && a.profileId === profileId);
    if (mine.some((a) => a.correct)) {
      return 'correct';
    }
    if (mine.some((a) => a.gaveUp)) {
      return 'gaveUp';
    }
    if (isVultoRuleset(this.match().mode)) {
      // Vulto rounds only reach this screen once someone scored (0-0 rounds
      // are already filtered out of cascadeRounds), so a Vulto round here
      // with no points for this player means the opponent was simply faster
      // — not a real timeout, so no tag for it.
      return 'none';
    }
    return 'timeout';
  }

  outcomeTag(outcome: RoundOutcome): string {
    if (outcome === 'correct') {
      return '✓';
    }
    if (outcome === 'gaveUp') {
      return this.i18n.t('match.gaveUpTag');
    }
    if (outcome === 'timeout') {
      return this.i18n.t('match.timedOutTag');
    }
    return '';
  }

  outcomeClass(outcome: RoundOutcome): string {
    return outcome === 'correct' ? 'text-emerald-300' : 'text-[#cbb9d6]/60';
  }

  /**
   * Winner reads big and glowing, loser reads small and dim, a tie sits in
   * between — the size gap itself is what makes the winner jump out at a
   * glance across 5 stacked cards, on top of the ring/badge below.
   */
  pointsClass(round: MatchRound, side: 'host' | 'guest'): string {
    const mine = side === 'host' ? round.hostPoints : round.guestPoints;
    const other = side === 'host' ? round.guestPoints : round.hostPoints;
    if (mine > other) {
      return 'text-4xl font-extrabold text-splash-gold [text-shadow:0_0_16px_rgba(201,169,89,0.85)] sm:text-5xl';
    }
    if (mine < other) {
      return 'text-xl font-semibold text-[#cbb9d6]/40 sm:text-2xl';
    }
    return 'text-3xl font-bold text-splash-gold/85 sm:text-4xl';
  }

  avatarRingClass(round: MatchRound, side: 'host' | 'guest'): string {
    const mine = side === 'host' ? round.hostPoints : round.guestPoints;
    const other = side === 'host' ? round.guestPoints : round.hostPoints;
    if (mine > other) {
      return 'scale-110 border-[3px] border-splash-gold shadow-[0_0_20px_6px_rgba(201,169,89,0.8)]';
    }
    if (mine < other) {
      return 'border-2 border-splash-gold/15 opacity-60';
    }
    return 'border-2 border-splash-gold/40';
  }

  isRoundWinner(round: MatchRound, side: 'host' | 'guest'): boolean {
    const mine = side === 'host' ? round.hostPoints : round.guestPoints;
    const other = side === 'host' ? round.guestPoints : round.hostPoints;
    return mine > other;
  }
}
