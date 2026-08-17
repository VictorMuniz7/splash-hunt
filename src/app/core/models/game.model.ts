import { SplashOption } from './champion.model';

export enum GameMode {
  Vulto = 'vulto',
  PretoEBranco = 'preto-e-branco',
}

export interface Attempt {
  championName: string;
  skinLabel: string;
  correct: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameResult {
  status: 'won' | 'lost';
  attempts: Attempt[];
  elapsedMs: number;
  activeModes: GameMode[];
  target: SplashOption;
}
