import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GameModeKey } from '../models/profile.model';
import { Room, RoomPlayer, RoomWithProfiles } from '../models/room.model';
import { TranslationKey } from './i18n.service';
import { SupabaseService } from './supabase.service';

export interface RoomResult {
  room: Room | null;
  error: string | null;
}

const ROOM_ERROR_KEYS: Record<string, TranslationKey> = {
  room_not_found: 'rooms.errorNotFound',
  room_not_joinable: 'rooms.errorNotJoinable',
  room_is_own: 'rooms.errorOwnRoom',
  match_not_startable: 'rooms.errorNotStartable',
  rematch_not_available: 'rooms.errorRematchNotAvailable',
  not_authenticated: 'auth.genericError',
};

/** Maps a room RPC's raised exception message (or any other error string) to a translation key. */
export function roomErrorKey(message: string): TranslationKey {
  return ROOM_ERROR_KEYS[message] || 'auth.genericError';
}

function mapRoom(row: Record<string, unknown>): Room {
  return {
    id: row['id'] as string,
    code: row['code'] as string,
    mode: row['mode'] as GameModeKey,
    hostId: row['host_id'] as string,
    guestId: (row['guest_id'] as string | null) ?? null,
    status: row['status'] as Room['status'],
    createdAt: row['created_at'] as string,
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

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly supabase = inject(SupabaseService);

  async createRoom(mode: GameModeKey): Promise<RoomResult> {
    const userId = this.supabase.session()?.user.id;
    if (!userId) {
      return { room: null, error: 'not_authenticated' };
    }

    const { data, error } = await this.supabase.client
      .from('rooms')
      .insert({ host_id: userId, mode, guest_id: null, status: 'waiting' })
      .select()
      .single();

    if (error || !data) {
      return { room: null, error: error?.message ?? 'unknown' };
    }
    return { room: mapRoom(data), error: null };
  }

  async joinRoom(code: string): Promise<RoomResult> {
    const { data, error } = await this.supabase.client.rpc('join_room', { p_code: code });
    if (error || !data) {
      return { room: null, error: error?.message ?? 'unknown' };
    }
    return { room: mapRoom(data), error: null };
  }

  async leaveRoom(roomId: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.rpc('leave_room', { p_room_id: roomId });
    return { error: error?.message ?? null };
  }

  async startMatch(roomId: string): Promise<RoomResult> {
    const { data, error } = await this.supabase.client.rpc('start_match', { p_room_id: roomId });
    if (error || !data) {
      return { room: null, error: error?.message ?? 'unknown' };
    }
    return { room: mapRoom(data), error: null };
  }

  async rematchRoom(roomId: string): Promise<RoomResult> {
    const { data, error } = await this.supabase.client.rpc('rematch_room', { p_room_id: roomId });
    if (error || !data) {
      return { room: null, error: error?.message ?? 'unknown' };
    }
    return { room: mapRoom(data), error: null };
  }

  async fetchRoomWithProfiles(roomId: string): Promise<RoomWithProfiles | null> {
    const { data, error } = await this.supabase.client
      .from('rooms')
      .select('*, host:profiles!host_id(id,nickname,avatar_url), guest:profiles!guest_id(id,nickname,avatar_url)')
      .eq('id', roomId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      ...mapRoom(data),
      host: mapPlayer(data['host'] as Record<string, unknown>) as RoomPlayer,
      guest: mapPlayer(data['guest'] as Record<string, unknown> | null),
    };
  }

  /** Caller owns the subscription's lifecycle — unsubscribe (supabase.client.removeChannel) on destroy. */
  subscribeToRoom(roomId: string, onEvent: (kind: 'change' | 'deleted') => void): RealtimeChannel {
    return this.supabase.client
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          onEvent(payload.eventType === 'DELETE' ? 'deleted' : 'change');
        },
      )
      .subscribe();
  }
}
