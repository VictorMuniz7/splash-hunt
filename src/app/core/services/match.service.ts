import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GameModeKey } from '../models/profile.model';
import { Match, MatchRound, MatchWithProfiles, RoundAttempt } from '../models/match.model';
import { RoomPlayer } from '../models/room.model';
import { TranslationKey } from './i18n.service';
import { SupabaseService } from './supabase.service';

export interface AttemptResult {
  attempt: RoundAttempt | null;
  error: string | null;
}

export interface RoundResult {
  round: MatchRound | null;
  error: string | null;
}

const MATCH_ERROR_KEYS: Record<string, TranslationKey> = {
  round_already_active: 'match.errorRoundAlreadyActive',
  already_answered: 'match.errorAlreadyAnswered',
  round_not_active: 'match.errorRoundNotActive',
  match_already_complete: 'match.errorMatchComplete',
  round_not_expired: 'match.errorRoundNotExpired',
  not_a_participant: 'match.errorNotParticipant',
  round_not_found: 'match.errorRoundNotFound',
};

/** Maps a match RPC's raised exception message to a translation key, mirroring roomErrorKey(). */
export function matchErrorKey(message: string): TranslationKey {
  return MATCH_ERROR_KEYS[message] || 'auth.genericError';
}

function mapMatch(row: Record<string, unknown>): Match {
  return {
    id: row['id'] as string,
    roomId: row['room_id'] as string,
    mode: row['mode'] as GameModeKey,
    hostId: row['host_id'] as string,
    guestId: row['guest_id'] as string,
    status: row['status'] as Match['status'],
    hostScore: row['host_score'] as number,
    guestScore: row['guest_score'] as number,
    winnerId: (row['winner_id'] as string | null) ?? null,
    currentRound: row['current_round'] as number,
    createdAt: row['created_at'] as string,
    finishedAt: (row['finished_at'] as string | null) ?? null,
  };
}

function mapPlayer(row: Record<string, unknown> | null): RoomPlayer | null {
  if (!row) {
    return null;
  }
  return {
    id: row['id'] as string,
    nickname: row['nickname'] as string,
    avatarUrl: (row['avatar_url'] as string | null) ?? null,
  };
}

function mapRound(row: Record<string, unknown>): MatchRound {
  return {
    id: row['id'] as string,
    matchId: row['match_id'] as string,
    roundNumber: row['round_number'] as number,
    championId: row['champion_id'] as string,
    championName: row['champion_name'] as string,
    skinNum: row['skin_num'] as number,
    skinLabel: row['skin_label'] as string,
    splashUrl: row['splash_url'] as string,
    status: row['status'] as MatchRound['status'],
    startedAt: row['started_at'] as string,
    resolvedAt: (row['resolved_at'] as string | null) ?? null,
    hostPoints: row['host_points'] as number,
    guestPoints: row['guest_points'] as number,
    hostFinished: row['host_finished'] as boolean,
    guestFinished: row['guest_finished'] as boolean,
  };
}

function mapAttempt(row: Record<string, unknown>): RoundAttempt {
  return {
    id: row['id'] as string,
    roundId: row['round_id'] as string,
    matchId: row['match_id'] as string,
    profileId: row['profile_id'] as string,
    championId: (row['champion_id'] as string | null) ?? null,
    championName: (row['champion_name'] as string | null) ?? null,
    skinNum: (row['skin_num'] as number | null) ?? null,
    skinLabel: (row['skin_label'] as string | null) ?? null,
    correct: row['correct'] as boolean,
    gaveUp: row['gave_up'] as boolean,
    createdAt: row['created_at'] as string,
  };
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly supabase = inject(SupabaseService);

  async fetchMatchWithProfiles(roomId: string): Promise<MatchWithProfiles | null> {
    const { data, error } = await this.supabase.client
      .from('matches')
      .select('*, host:profiles!host_id(id,nickname,avatar_url), guest:profiles!guest_id(id,nickname,avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      ...mapMatch(data),
      host: mapPlayer(data['host'] as Record<string, unknown>) as RoomPlayer,
      guest: mapPlayer(data['guest'] as Record<string, unknown>) as RoomPlayer,
    };
  }

  async fetchRounds(matchId: string): Promise<MatchRound[]> {
    const { data, error } = await this.supabase.client
      .from('match_rounds')
      .select('*')
      .eq('match_id', matchId)
      .order('round_number', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data.map(mapRound);
  }

  async fetchAttempts(matchId: string): Promise<RoundAttempt[]> {
    const { data, error } = await this.supabase.client
      .from('round_attempts')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data.map(mapAttempt);
  }

  async startRound(
    matchId: string,
    championId: string,
    championName: string,
    skinNum: number,
    skinLabel: string,
    splashUrl: string,
  ): Promise<RoundResult> {
    const { data, error } = await this.supabase.client.rpc('start_round', {
      p_match_id: matchId,
      p_champion_id: championId,
      p_champion_name: championName,
      p_skin_num: skinNum,
      p_skin_label: skinLabel,
      p_splash_url: splashUrl,
    });
    if (error || !data) {
      return { round: null, error: error?.message ?? 'unknown' };
    }
    return { round: mapRound(data), error: null };
  }

  async submitAttempt(
    roundId: string,
    championId: string,
    championName: string,
    skinNum: number,
    skinLabel: string,
  ): Promise<AttemptResult> {
    const { data, error } = await this.supabase.client.rpc('submit_attempt', {
      p_round_id: roundId,
      p_champion_id: championId,
      p_champion_name: championName,
      p_skin_num: skinNum,
      p_skin_label: skinLabel,
    });
    if (error || !data) {
      return { attempt: null, error: error?.message ?? 'unknown' };
    }
    return { attempt: mapAttempt(data), error: null };
  }

  async giveUpRound(roundId: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.rpc('give_up_round', { p_round_id: roundId });
    return { error: error?.message ?? null };
  }

  /** How far this device's clock is from the server's (ms to add to Date.now()). */
  private clockOffsetMs = 0;
  private clockSynced?: Promise<void>;

  /** Round deadlines come from the server's clock (started_at), so countdowns
   * must use server time too: a device running 20s behind would otherwise
   * show 20s extra. Measured once per page load against /api/time (Vercel);
   * if that's unavailable (e.g. local `ng serve`), falls back to the device
   * clock. */
  syncClock(): Promise<void> {
    this.clockSynced ??= (async () => {
      try {
        const sentAt = Date.now();
        const res = await fetch('/api/time', { cache: 'no-store' });
        const receivedAt = Date.now();
        const { now } = (await res.json()) as { now: number };
        if (typeof now === 'number') {
          this.clockOffsetMs = now - (sentAt + receivedAt) / 2;
        }
      } catch {
        // No time endpoint: keep the device clock.
      }
    })();
    return this.clockSynced;
  }

  serverNow(): number {
    return Date.now() + this.clockOffsetMs;
  }

  async resolveRoundTimeout(roundId: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.rpc('resolve_round_timeout', { p_round_id: roundId });
    return { error: error?.message ?? null };
  }

  /** Caller owns the subscription's lifecycle — unsubscribe (supabase.client.removeChannel) on destroy. */
  subscribeToMatch(matchId: string, onEvent: () => void): RealtimeChannel {
    return this.supabase.client
      .channel(`match:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, () =>
        onEvent(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_rounds', filter: `match_id=eq.${matchId}` },
        () => onEvent(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_attempts', filter: `match_id=eq.${matchId}` },
        () => onEvent(),
      )
      .subscribe();
  }
}
