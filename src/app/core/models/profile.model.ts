export type GameModeKey = 'padrao' | 'vulto' | 'preto_e_branco' | 'anomaly';

export interface Profile {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export interface MatchStat {
  id: string;
  profileId: string;
  mode: GameModeKey;
  result: 'win' | 'loss';
  createdAt: string;
}

export interface ModeStats {
  wins: number;
  losses: number;
}

export type StatsByMode = Record<GameModeKey, ModeStats>;

export const EMPTY_STATS_BY_MODE: StatsByMode = {
  padrao: { wins: 0, losses: 0 },
  vulto: { wins: 0, losses: 0 },
  preto_e_branco: { wins: 0, losses: 0 },
  anomaly: { wins: 0, losses: 0 },
};
