import { TranslationKey } from '../services/i18n.service';
import { GameModeKey } from './profile.model';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface Room {
  id: string;
  code: string;
  mode: GameModeKey;
  hostId: string;
  guestId: string | null;
  status: RoomStatus;
  createdAt: string;
}

export interface RoomPlayer {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface RoomWithProfiles extends Room {
  host: RoomPlayer;
  guest: RoomPlayer | null;
}

/** The 4 game modes, shared by the profile stats grid and the room mode picker. */
export const GAME_MODES: { key: GameModeKey; labelKey: TranslationKey }[] = [
  { key: 'padrao', labelKey: 'profile.mode.padrao' },
  { key: 'vulto', labelKey: 'profile.mode.vulto' },
  { key: 'preto_e_branco', labelKey: 'profile.mode.pretoEBranco' },
  { key: 'anomaly', labelKey: 'profile.mode.anomaly' },
];
