import { GameModeKey } from './profile.model';
import { RoomPlayer } from './room.model';

export type MatchStatus = 'active' | 'finished';
export type RoundStatus = 'active' | 'resolved';

export interface Match {
  id: string;
  roomId: string;
  mode: GameModeKey;
  hostId: string;
  guestId: string;
  status: MatchStatus;
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  currentRound: number;
  createdAt: string;
  finishedAt: string | null;
}

export interface MatchWithProfiles extends Match {
  host: RoomPlayer;
  guest: RoomPlayer;
}

export interface MatchRound {
  id: string;
  matchId: string;
  roundNumber: number;
  championId: string;
  championName: string;
  skinNum: number;
  skinLabel: string;
  splashUrl: string;
  status: RoundStatus;
  startedAt: string;
  resolvedAt: string | null;
  hostPoints: number;
  guestPoints: number;
  hostFinished: boolean;
  guestFinished: boolean;
}

export interface RoundAttempt {
  id: string;
  roundId: string;
  matchId: string;
  profileId: string;
  championId: string | null;
  championName: string | null;
  skinNum: number | null;
  skinLabel: string | null;
  correct: boolean;
  gaveUp: boolean;
  createdAt: string;
}

/**
 * Mapping from the room/profile system's GameModeKey to the solo-mode visual
 * modifiers and scoring ruleset. Kept in sync manually with the equivalent
 * `mode in ('vulto','anomaly')` branches in schema.sql's resolve_round /
 * submit_attempt / resolve_round_timeout — there's no shared source of truth
 * across the SQL/TS boundary in this design.
 */
export function modeModifiers(mode: GameModeKey): { vulto: boolean; pretoEBranco: boolean } {
  return {
    vulto: mode === 'vulto' || mode === 'anomaly',
    pretoEBranco: mode === 'preto_e_branco' || mode === 'anomaly',
  };
}

/** Vulto/Anomaly use a first-to-3 race instead of a fixed 5-round point sum. */
export function isVultoRuleset(mode: GameModeKey): boolean {
  return mode === 'vulto' || mode === 'anomaly';
}
