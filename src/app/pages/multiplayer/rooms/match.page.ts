import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import {
  INITIAL_ZOOM,
  MIN_ZOOM,
  MULTIPLAYER_NEXT_ROUND_DELAY_MS,
  MULTIPLAYER_ROUNDS,
  MULTIPLAYER_ROUND_S,
  VULTO_COUNTDOWN_S,
  VULTO_REVEAL_MS,
  VULTO_WIN_POINTS,
  ZOOM_STEP,
} from '../../../core/config/game.config';
import { GameMode } from '../../../core/models/game.model';
import { MatchRound, MatchWithProfiles, RoundAttempt } from '../../../core/models/match.model';
import { DataDragonService } from '../../../core/services/data-dragon.service';
import { I18nService } from '../../../core/services/i18n.service';
import { matchErrorKey, MatchService } from '../../../core/services/match.service';
import { roomErrorKey, RoomService } from '../../../core/services/room.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ChampionCombobox, ComboOption } from '../../../shared/components/champion-combobox/champion-combobox';
import { ModeBadges } from '../../../shared/components/mode-badges/mode-badges';
import { ModeIcon } from '../../../shared/components/mode-icon/mode-icon';
import { EnterAnimateDirective } from '../../../shared/directives/enter-animate.directive';
import { MatchResults } from './match-results/match-results';

@Component({
  selector: 'app-match-page',
  imports: [ChampionCombobox, ModeBadges, ModeIcon, MatchResults, EnterAnimateDirective],
  templateUrl: './match.page.html',
})
export class MatchPage implements OnInit, OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly roomService = inject(RoomService);
  private readonly dataDragon = inject(DataDragonService);

  protected readonly GameMode = GameMode;
  protected readonly MULTIPLAYER_ROUNDS = MULTIPLAYER_ROUNDS;
  protected readonly VULTO_WIN_POINTS = VULTO_WIN_POINTS;

  private readonly roomId = this.route.snapshot.paramMap.get('roomId')!;
  private channel: RealtimeChannel | null = null;
  private tickHandle?: ReturnType<typeof setInterval>;
  private vultoRevealHandle?: ReturnType<typeof setTimeout>;
  private nextRoundHandle?: ReturnType<typeof setTimeout>;

  readonly loading = signal(true);
  readonly match = signal<MatchWithProfiles | null>(null);
  readonly rounds = signal<MatchRound[]>([]);
  readonly attempts = signal<RoundAttempt[]>([]);
  readonly now = signal(Date.now());
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly startingRound = signal(false);
  readonly vultoHidden = signal(false);
  readonly confirmingGiveUp = signal(false);

  readonly championOptions = signal<ComboOption[]>([]);
  readonly skinOptions = signal<ComboOption[]>([]);
  readonly selectedChampion = signal<ComboOption | null>(null);
  readonly selectedSkin = signal<ComboOption | null>(null);
  readonly skinsLoading = signal(false);

  readonly isHost = computed(() => this.match()?.hostId === this.supabase.session()?.user.id);
  readonly isVultoMode = computed(() => {
    const mode = this.match()?.mode;
    return mode === 'vulto' || mode === 'anomaly';
  });
  readonly isPretoEBrancoMode = computed(() => {
    const mode = this.match()?.mode;
    return mode === 'preto_e_branco' || mode === 'anomaly';
  });
  protected readonly activeModes = computed<GameMode[]>(() => {
    const modes: GameMode[] = [];
    if (this.isVultoMode()) {
      modes.push(GameMode.Vulto);
    }
    if (this.isPretoEBrancoMode()) {
      modes.push(GameMode.PretoEBranco);
    }
    return modes;
  });

  readonly currentRound = computed<MatchRound | null>(() => {
    const list = this.rounds();
    return list.find((r) => r.status === 'active') ?? list[list.length - 1] ?? null;
  });
  private readonly currentRoundId = computed(() => this.currentRound()?.id ?? null);

  /**
   * Only MY OWN attempts this round — each player's guesses (and the zoom
   * reveal they earn from wrong ones) are private, not shared with the
   * opponent, so this is scoped by profileId rather than just roundId.
   */
  readonly myRoundAttempts = computed(() => {
    const roundId = this.currentRoundId();
    const myId = this.supabase.session()?.user.id;
    return roundId ? this.attempts().filter((a) => a.roundId === roundId && a.profileId === myId) : [];
  });
  private readonly wrongAttemptCount = computed(
    () => this.myRoundAttempts().filter((a) => !a.correct && !a.gaveUp).length,
  );
  /** championId_skinNum keys this player already guessed wrong this round — excluded from the skin selector. */
  readonly excludedSkins = computed(() => {
    return new Set(
      this.myRoundAttempts()
        .filter((a) => !a.correct && !a.gaveUp)
        .map((a) => `${a.championId}_${a.skinNum}`),
    );
  });
  readonly myFinished = computed(() => {
    const round = this.currentRound();
    if (!round) {
      return false;
    }
    return this.isHost() ? round.hostFinished : round.guestFinished;
  });
  readonly opponentFinished = computed(() => {
    const round = this.currentRound();
    if (!round) {
      return false;
    }
    return this.isHost() ? round.guestFinished : round.hostFinished;
  });

  /**
   * Once I've answered (correctly or given up) there's nothing left for me to
   * guess, so I see the full splash right away — no need to wait on the
   * opponent or for the round to fully resolve.
   */
  readonly isFullReveal = computed(() => this.currentRound()?.status === 'resolved' || this.myFinished());
  readonly zoom = computed(() => {
    if (this.isFullReveal()) {
      return MIN_ZOOM;
    }
    return Math.max(MIN_ZOOM, INITIAL_ZOOM - ZOOM_STEP * this.wrongAttemptCount());
  });
  /**
   * The zoomed-in mystery-crop states use a percentage background-size so the
   * crop matches the configured zoom level exactly; at full reveal the
   * viewport itself switches to the splash's own rectangular aspect ratio
   * (see the template), so `cover` there just fills that box cleanly instead
   * of stretching a percentage against a now-mismatched container shape.
   */
  readonly backgroundSize = computed(() => (this.isFullReveal() ? 'cover' : `${this.zoom() * 100}%`));

  readonly roundDurationS = computed(() => (this.isVultoMode() ? VULTO_REVEAL_MS / 1000 + VULTO_COUNTDOWN_S : MULTIPLAYER_ROUND_S));
  readonly secondsLeft = computed(() => {
    const round = this.currentRound();
    if (!round || round.status !== 'active') {
      return 0;
    }
    const elapsed = (this.now() - new Date(round.startedAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(this.roundDurationS() - elapsed));
  });
  readonly vultoCountdown = computed(() => Math.max(0, this.secondsLeft()));

  readonly canSubmit = computed(
    () =>
      !!this.selectedChampion() &&
      !!this.selectedSkin() &&
      !this.myFinished() &&
      this.currentRound()?.status === 'active' &&
      !this.submitting(),
  );

  private timeoutTriggeredFor: string | null = null;
  private roundStartedForId: string | null = null;

  constructor() {
    this.dataDragon.getChampions().subscribe((champions) => {
      this.championOptions.set(champions.map((c) => ({ id: c.id, label: c.name })));
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
        const excluded = this.excludedSkins();
        const skins = this.dataDragon
          .realSkins(detail)
          .filter((s) => !excluded.has(`${champion.id}_${s.num}`))
          .slice()
          .sort((a, b) => a.num - b.num);
        this.skinOptions.set(skins.map((s) => ({ id: String(s.num), label: this.dataDragon.skinLabel(s) })));
        this.skinsLoading.set(false);
      });
    });

    // Host-only: whenever there's no active round and the match isn't over,
    // sort a fresh splash and start the next round after a short pause.
    // Gated on !loading() — otherwise this can fire before ngOnInit's own
    // initial fetch resolves, and that fetch (kicked off before round 1
    // existed) can land afterwards and wipe the optimistically-added round
    // back to an empty list.
    effect(() => {
      const match = this.match();
      const round = this.currentRound();
      if (this.loading() || !match || !this.isHost() || match.status !== 'active') {
        return;
      }
      if (round?.status === 'active' || this.startingRound()) {
        return;
      }
      const isFirstRound = this.rounds().length === 0;
      this.scheduleNextRound(match.id, isFirstRound ? 0 : MULTIPLAYER_NEXT_ROUND_DELAY_MS);
    });

    // Runs once per round transition: clears any in-progress guess left over
    // from a round that ended without me answering (e.g. the opponent scored
    // first in Vulto) — otherwise it silently carries into the new round's
    // combobox. Also, for Vulto, flashes the splash for VULTO_REVEAL_MS then
    // hides it.
    effect(() => {
      const roundId = this.currentRoundId();
      const isVulto = this.isVultoMode();
      const status = this.currentRound()?.status;
      if (roundId === this.roundStartedForId) {
        return;
      }
      this.roundStartedForId = roundId;
      this.selectedChampion.set(null);
      if (this.vultoRevealHandle) {
        clearTimeout(this.vultoRevealHandle);
      }
      this.vultoHidden.set(false);
      if (roundId && isVulto && status === 'active') {
        this.vultoRevealHandle = setTimeout(() => this.vultoHidden.set(true), VULTO_REVEAL_MS);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const match = await this.matchService.fetchMatchWithProfiles(this.roomId);
    if (!match) {
      this.router.navigateByUrl(`/multiplayer/salas/${this.roomId}`);
      return;
    }
    this.match.set(match);

    const [rounds, attempts] = await Promise.all([
      this.matchService.fetchRounds(match.id),
      this.matchService.fetchAttempts(match.id),
      this.matchService.syncClock(),
    ]);
    this.now.set(this.matchService.serverNow());
    this.rounds.set(rounds);
    this.attempts.set(attempts);
    this.loading.set(false);

    this.channel = this.matchService.subscribeToMatch(match.id, () => this.refresh(match.id));
    this.tickHandle = setInterval(() => {
      this.now.set(this.matchService.serverNow());
      this.checkTimeout();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
    }
    if (this.vultoRevealHandle) {
      clearTimeout(this.vultoRevealHandle);
    }
    if (this.nextRoundHandle) {
      clearTimeout(this.nextRoundHandle);
    }
  }

  private async refresh(matchId: string): Promise<void> {
    const [match, rounds, attempts] = await Promise.all([
      this.matchService.fetchMatchWithProfiles(this.roomId),
      this.matchService.fetchRounds(matchId),
      this.matchService.fetchAttempts(matchId),
    ]);
    if (match) {
      this.match.set(match);
    }
    this.rounds.set(rounds);
    this.attempts.set(attempts);
  }

  private checkTimeout(): void {
    const round = this.currentRound();
    if (!round || round.status !== 'active') {
      return;
    }
    if (this.secondsLeft() > 0 || this.timeoutTriggeredFor === round.id) {
      return;
    }
    this.timeoutTriggeredFor = round.id;
    void this.matchService.resolveRoundTimeout(round.id).then(({ error }) => {
      // The server re-checks the deadline with its own clock. If this
      // device's clock runs a bit ahead, it rejects the call; without
      // retrying, the round would sit at "0s" until the opponent's client
      // (or nobody) closed it. Clearing the flag retries on the next tick.
      if (error && this.timeoutTriggeredFor === round.id) {
        this.timeoutTriggeredFor = null;
      }
    });
  }

  private scheduleNextRound(matchId: string, delayMs: number): void {
    if (this.nextRoundHandle) {
      clearTimeout(this.nextRoundHandle);
    }
    this.startingRound.set(true);
    this.nextRoundHandle = setTimeout(async () => {
      const champion = await firstValueFrom(this.dataDragon.getRandomSplashOption());
      const { round, error } = await this.matchService.startRound(
        matchId,
        champion.championId,
        champion.championName,
        champion.skinNum,
        champion.skinLabel,
        champion.splashUrl,
      );
      // Update local state immediately rather than waiting on the realtime
      // round-trip — otherwise this effect re-fires against stale state
      // (still no active round from its own point of view) and races itself
      // into starting a second round on top of the one that just succeeded.
      if (round) {
        this.rounds.update((list) => [...list, round]);
      }
      this.startingRound.set(false);
      if (error && error !== 'round_already_active') {
        this.error.set(this.i18n.t(matchErrorKey(error)));
      }
    }, delayMs);
  }

  async submit(): Promise<void> {
    const round = this.currentRound();
    const champion = this.selectedChampion();
    const skin = this.selectedSkin();
    if (!round || !champion || !skin || !this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { attempt, error } = await this.matchService.submitAttempt(
      round.id,
      champion.id,
      champion.label,
      Number(skin.id),
      skin.label,
    );
    this.submitting.set(false);
    this.selectedChampion.set(null);
    if (attempt) {
      // Update locally rather than waiting on the realtime round-trip — the
      // wrong-guess exclusion and zoom react to this list immediately.
      this.attempts.update((list) => [...list, attempt]);
      if (attempt.correct) {
        this.markMyRoundFinished(round.id);
      }
    }
    if (error) {
      this.error.set(this.i18n.t(matchErrorKey(error)));
    }
  }

  async giveUp(): Promise<void> {
    if (!this.confirmingGiveUp()) {
      this.confirmingGiveUp.set(true);
      return;
    }
    this.confirmingGiveUp.set(false);
    const round = this.currentRound();
    if (!round) {
      return;
    }
    const { error } = await this.matchService.giveUpRound(round.id);
    if (error) {
      this.error.set(this.i18n.t(matchErrorKey(error)));
    } else {
      this.markMyRoundFinished(round.id);
    }
  }

  /**
   * Optimistically flips my own hostFinished/guestFinished flag the instant a
   * correct answer or give-up is confirmed, rather than waiting on the
   * realtime round-trip — that's what isFullReveal (zoom, background-size,
   * grayscale, aspect ratio) reacts to, so without this the full-color
   * rectangular reveal would only appear once realtime catches up, which can
   * lag noticeably.
   */
  private markMyRoundFinished(roundId: string): void {
    this.rounds.update((list) =>
      list.map((r) =>
        r.id === roundId ? { ...r, ...(this.isHost() ? { hostFinished: true } : { guestFinished: true }) } : r,
      ),
    );
  }

  cancelGiveUp(): void {
    this.confirmingGiveUp.set(false);
  }

  backToRoom(): void {
    this.router.navigateByUrl(`/multiplayer/salas/${this.roomId}`);
  }

  async playAgain(): Promise<void> {
    // Never strand the host on the results screen — navigate to the lobby
    // regardless of whether the rematch RPC succeeds; the lobby renders
    // whatever the room's actual current status is either way.
    const { error } = await this.roomService.rematchRoom(this.roomId);
    if (error) {
      this.error.set(this.i18n.t(roomErrorKey(error)));
    }
    this.backToRoom();
  }

  async leaveFromResults(): Promise<void> {
    await this.roomService.leaveRoom(this.roomId);
    this.router.navigateByUrl('/multiplayer/salas');
  }
}
